/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { SlideRenderer } from './components/SlideRenderer';
import { EditorField } from './components/editors/EditorField';
import { CF } from './lib/canvasEditorFieldIds';
import { ProjectPreviewModal } from './components/ProjectPreviewModal';
import { cloneDefaultSlides } from './data';
import { Slide, Project, ListItem, ScheduleRow } from './types';
import {
  Plus,
  Download,
  FileDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Trash2,
  ArrowLeft,
  Search,
  FileText,
  Upload,
  LayoutTemplate,
  Presentation,
  Copy,
  ArrowRightLeft,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { cn } from './lib/utils';
import { safeImageSrc } from './lib/urls';
import { ImageSourceField, normalizeImageFieldValue } from './components/ImageSourceField';
import { loadProjectsFromStorage, saveProjectsToStorage, parseProjectImportJson } from './lib/projectStorage';
import {
  MAX_IMPORT_CSV_BYTES,
  MAX_IMPORT_JSON_BYTES,
  MAX_LIST_ITEMS,
  MAX_SCHEDULE_ROWS,
  MAX_SLIDES_PER_PROJECT,
} from './lib/projectLimits';
import { SLIDE_TYPE_LABELS } from './lib/slideLabels';
import { createEmptySlide } from './lib/createEmptySlide';
import {
  exportListSlideCsv,
  exportScheduleSlideCsv,
  parseListItemsCsv,
  parseScheduleRowsCsv,
} from './lib/slideCsv';
import {
  ConceptEditor,
  CustomEditor,
  GridEditor,
  ListEditor,
  ScheduleEditor,
  SplitEditor,
} from './components/editors/SlideEditors';
import { CopySlidesToProjectModal } from './components/CopySlidesToProjectModal';
import { DeleteProjectConfirmModal } from './components/DeleteProjectConfirmModal';
import { ImportProjectsConfirmModal } from './components/ImportProjectsConfirmModal';
import { ImportCsvConfirmModal } from './components/ImportCsvConfirmModal';
import { DeleteSlideConfirmModal } from './components/DeleteSlideConfirmModal';
import { LoadTemplateConfirmModal } from './components/LoadTemplateConfirmModal';
import { FirebaseLogin } from './components/FirebaseLogin';
import { useFirebaseAuth } from './contexts/FirebaseAuthContext';
import { isFirebaseConfigured } from './lib/firebase';
import { loadUserProjectsFromCloud, saveUserProjectsToCloud } from './lib/firestoreProjects';
import { SLIDE_CANVAS_H, SLIDE_CANVAS_W } from './lib/slideDimensions';
import { cloneSlideWithNewIds, duplicateProject as duplicateProjectDeep } from './lib/cloneProject';
import vodeLogoUrl from './assets/vode.png';
import vodeSymbolUrl from './assets/vode-symbol.png';

/** 横長ワードマーク。シンボルと同じ行高（h-9）でベースラインを揃える */
const vodeLogoImgClass =
  'block h-9 w-auto max-w-[min(100%,220px)] shrink-0 object-contain object-left sm:max-w-[min(100%,260px)]';

/** エディタ左カラム用ワードマーク（シンボルと同じ h-8） */
const vodeLogoSidebarClass =
  'block h-8 w-auto max-w-[min(100%,176px)] shrink-0 object-contain object-left';

/** 正方形シンボル（ワードマークと同じ行の高さに合わせる） */
const vodeSymbolDashboardClass = 'block h-9 w-9 shrink-0 object-contain object-center';

const vodeSymbolSidebarClass = 'block h-8 w-8 shrink-0 object-contain object-center';

/** ロゴ行：ギャップ・縦位置を共通に */
const vodeBrandRowClass = 'flex min-w-0 items-center gap-3';

const SESSION_RIGHT_PANEL = 'vode-editor-right-panel-open';
const SESSION_CANVAS_MODE = 'vode-editor-canvas-mode';

type CanvasViewMode = 'fit' | 'actual';
type PendingImport = { projects: Project[]; fileName: string; mode: 'single' | 'all' };
type PendingCsvImport =
  | { kind: 'list'; fileName: string; rows: ListItem[] }
  | { kind: 'schedule'; fileName: string; rows: ScheduleRow[] };

function safeDownloadNamePart(raw: string): string {
  return raw
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'project';
}

function projectForNewImport(project: Project): Project {
  return {
    ...project,
    id: crypto.randomUUID(),
  };
}

function projectForCurrentReplacement(project: Project, currentId: string): Project {
  return {
    ...project,
    id: currentId,
  };
}

function readSessionRightPanelOpen(): boolean {
  try {
    const v = sessionStorage.getItem(SESSION_RIGHT_PANEL);
    if (v === '0') return false;
    if (v === '1') return true;
  } catch {
    /* ignore */
  }
  return true;
}

function writeSessionRightPanelOpen(open: boolean) {
  try {
    sessionStorage.setItem(SESSION_RIGHT_PANEL, open ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function readSessionCanvasMode(): CanvasViewMode {
  try {
    const v = sessionStorage.getItem(SESSION_CANVAS_MODE);
    if (v === 'actual') return 'actual';
  } catch {
    /* ignore */
  }
  return 'fit';
}

function writeSessionCanvasMode(mode: CanvasViewMode) {
  try {
    sessionStorage.setItem(SESSION_CANVAS_MODE, mode);
  } catch {
    /* ignore */
  }
}

function buildSeedProjects(): Project[] {
  return [
    { id: '1', title: 'サービス紹介資料 (テンプレート)', company: '〇〇株式会社', date: '2026.04.23', thumbnail: '', slides: cloneDefaultSlides() },
    { id: '2', title: 'Q2 プロモーション提案', company: '株式会社テスト', date: '2026.04.20', thumbnail: '', slides: [] },
    { id: '3', title: 'ウェビナー登壇スライド', company: '自社会社用', date: '2026.04.15', thumbnail: '', slides: [] },
    { id: '4', title: 'SNS展開 キャンペーン方針', company: 'DEMO Inc.', date: '2026.04.10', thumbnail: '', slides: [] },
  ];
}

export default function App() {
  const { isFirebaseConfigured: fbConfigured, authLoading, user: fbUser, signOutUser } = useFirebaseAuth();
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'slides'>('date');

  const [projects, setProjects] = useState<Project[]>(() => {
    const stored = loadProjectsFromStorage();
    return stored && stored.length > 0 ? stored : buildSeedProjects();
  });
  const [activeProjectId, setActiveProjectId] = useState<string>('1');
  const projectsRef = useRef(projects);
  projectsRef.current = projects;

  const [cloudHydrated, setCloudHydrated] = useState(() => !isFirebaseConfigured());

  const [toast, setToast] = useState<{ message: string; variant: 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 5200);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setCloudHydrated(true);
      return;
    }
    const uid = fbUser?.uid;
    if (!uid) {
      setCloudHydrated(false);
      return;
    }
    let cancelled = false;
    setCloudHydrated(false);
    void (async () => {
      try {
        const cloud = await loadUserProjectsFromCloud(uid);
        if (cancelled) return;
        if (cloud && cloud.length > 0) {
          setProjects(cloud);
          setActiveProjectId(cloud[0]!.id);
        } else {
          await saveUserProjectsToCloud(uid, projectsRef.current);
        }
      } catch {
        if (!cancelled) {
          setToast({
            message: 'クラウドからの読み込みに失敗しました。ネットワークと Firebase の設定を確認してください。',
            variant: 'error',
          });
        }
      } finally {
        if (!cancelled) setCloudHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fbUser?.uid]);

  useEffect(() => {
    if (!isFirebaseConfigured() || !fbUser?.uid || !cloudHydrated) return;
    const id = window.setTimeout(() => {
      void saveUserProjectsToCloud(fbUser.uid, projects).catch(() => {
        setToast({
          message: 'クラウドへの保存に失敗しました。ネットワークを確認してください。',
          variant: 'error',
        });
      });
    }, 1500);
    return () => window.clearTimeout(id);
  }, [projects, fbUser?.uid, cloudHydrated]);

  const importInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const [canvasViewportSize, setCanvasViewportSize] = useState({ w: 0, h: 0 });
  const [importConfirm, setImportConfirm] = useState<PendingImport | null>(null);
  const [csvImportConfirm, setCsvImportConfirm] = useState<PendingCsvImport | null>(null);
  const [pendingDeleteSlideIndex, setPendingDeleteSlideIndex] = useState<number | null>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(readSessionRightPanelOpen);
  const [canvasViewMode, setCanvasViewMode] = useState<CanvasViewMode>(readSessionCanvasMode);

  const [previewProjectId, setPreviewProjectId] = useState<string | null>(null);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const [copySlidesModalOpen, setCopySlidesModalOpen] = useState(false);
  const [templateLoadConfirmOpen, setTemplateLoadConfirmOpen] = useState(false);
  const [templateLoadConfirmSlideCount, setTemplateLoadConfirmSlideCount] = useState(0);
  const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<string | null>(null);
  const previewProject = previewProjectId ? projects.find((p) => p.id === previewProjectId) ?? null : null;
  const pendingDeleteProject =
    pendingDeleteProjectId === null ? null : projects.find((p) => p.id === pendingDeleteProjectId) ?? null;

  const openProjectPreview = (p: Project, startIndex = 0) => {
    if (p.slides.length === 0) return;
    setPreviewProjectId(p.id);
    setPreviewSlideIndex(Math.min(Math.max(0, startIndex), p.slides.length - 1));
  };

  const closeProjectPreview = () => setPreviewProjectId(null);

  useEffect(() => {
    if (!previewProjectId) return;
    const p = projects.find((x) => x.id === previewProjectId);
    if (!p || p.slides.length === 0) setPreviewProjectId(null);
  }, [previewProjectId, projects]);

  useEffect(() => {
    if (pendingDeleteProjectId === null) return;
    if (!projects.some((p) => p.id === pendingDeleteProjectId)) {
      setPendingDeleteProjectId(null);
    }
  }, [projects, pendingDeleteProjectId]);

  useEffect(() => {
    if (!previewProject) return;
    setPreviewSlideIndex((i) => Math.min(i, Math.max(0, previewProject.slides.length - 1)));
  }, [previewProject, previewProjectId]);

  useEffect(() => {
    saveProjectsToStorage(projects);
  }, [projects]);

  useEffect(() => {
    if (projects.length === 0) return;
    if (!projects.some((p) => p.id === activeProjectId)) {
      setActiveProjectId(projects[0]!.id);
    }
  }, [projects, activeProjectId]);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const slides = activeProject.slides;

  useEffect(() => {
    const len = slides.length;
    setCurrentIndex((i) => {
      if (len === 0) return 0;
      return Math.min(i, len - 1);
    });
  }, [activeProjectId, slides.length]);
  const targetCompany = activeProject.company;
  const creationDate = activeProject.date;

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (pendingDeleteSlideIndex === null) return;
    if (slides.length === 0 || pendingDeleteSlideIndex >= slides.length) {
      setPendingDeleteSlideIndex(null);
    }
  }, [slides.length, pendingDeleteSlideIndex]);

  const setSlides = (updater: Slide[] | ((prev: Slide[]) => Slide[])) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return { ...p, slides: typeof updater === 'function' ? updater(p.slides) : updater };
      }
      return p;
    }));
  };

  const updateProjectDetails = (updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, ...updates } : p));
  };

  const createProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      title: '新規プロジェクト',
      company: '未設定',
      date: new Date().toLocaleDateString('ja-JP').replace(/\//g, '.'),
      thumbnail: '',
      slides: cloneDefaultSlides(),
    };
    setProjects([newProject, ...projects]);
    setActiveProjectId(newProject.id);
    setView('editor');
  };

  const requestDeleteProject = (project: Project) => {
    if (projects.length <= 1) {
      setToast({
        message: 'プロジェクトが 1 件しかないため削除できません。不要な場合は内容を編集してください。',
        variant: 'error',
      });
      return;
    }
    setPendingDeleteProjectId(project.id);
  };

  const executePendingDeleteProject = () => {
    if (pendingDeleteProjectId === null) return;
    const id = pendingDeleteProjectId;
    const project = projects.find((p) => p.id === id);
    if (!project || projects.length <= 1) {
      setPendingDeleteProjectId(null);
      return;
    }
    const title = project.title;
    const next = projects.filter((p) => p.id !== id);
    setProjects(next);
    setPendingDeleteProjectId(null);
    if (activeProjectId === id && next[0]) {
      setActiveProjectId(next[0].id);
    }
    if (previewProjectId === id) {
      setPreviewProjectId(null);
    }
    setToast({ message: `「${title}」を削除しました。`, variant: 'info' });
  };

  const duplicateProjectFromDashboard = (project: Project) => {
    const copy = duplicateProjectDeep(project);
    setProjects([copy, ...projects]);
    setActiveProjectId(copy.id);
    setView('editor');
    setToast({ message: `「${copy.title}」を作成しました（テンプレートの複製として編集できます）。`, variant: 'info' });
  };

  const duplicateSlideAt = (index: number) => {
    const s = slides[index];
    if (!s) return;
    const copy = cloneSlideWithNewIds(s);
    setSlides((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
    setCurrentIndex(index + 1);
    setToast({ message: `スライド ${index + 1} を複製しました。`, variant: 'info' });
  };

  const otherProjectsForCopy = projects.filter((p) => p.id !== activeProjectId);

  const handleCopySlidesToProjectConfirm = (targetProjectId: string, orderedSlideIds: string[]) => {
    const idSet = new Set(orderedSlideIds);
    const toCopy = slides.filter((s) => idSet.has(s.id)).map(cloneSlideWithNewIds);
    const target = projects.find((p) => p.id === targetProjectId);
    if (!target || toCopy.length === 0) return;
    if (target.slides.length + toCopy.length > MAX_SLIDES_PER_PROJECT) {
      setToast({
        message: `コピー先は最大 ${MAX_SLIDES_PER_PROJECT} 枚までです。先にスライドを減らすか、コピー枚数を減らしてください。`,
        variant: 'error',
      });
      return;
    }
    const date = new Date().toLocaleDateString('ja-JP').replace(/\//g, '.');
    setProjects((prev) =>
      prev.map((p) =>
        p.id === targetProjectId ? { ...p, slides: [...p.slides, ...toCopy], date } : p
      )
    );
    setCopySlidesModalOpen(false);
    setToast({
      message: `${toCopy.length} 枚を「${target.title}」の末尾にコピーしました。`,
      variant: 'info',
    });
  };

  const activeSlide = slides[currentIndex];

  const [linkedCanvasFieldId, setLinkedCanvasFieldId] = useState<string | null>(null);
  const slideFieldLink = useMemo(
    () => ({
      onFieldFocus: (id: string) => setLinkedCanvasFieldId(id),
      onFieldBlur: () => setLinkedCanvasFieldId(null),
    }),
    []
  );

  useEffect(() => {
    setLinkedCanvasFieldId(null);
  }, [activeSlide?.id, currentIndex, view]);

  useEffect(() => {
    if (view !== 'editor') {
      setTemplateLoadConfirmOpen(false);
    }
  }, [view]);

  const handlePrint = () => {
    window.print();
  };

  const addSlide = (type: Slide['type']) => {
    setSlides([...slides, createEmptySlide(type)]);
    setCurrentIndex(slides.length);
  };

  const requestRemoveSlide = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (slides.length === 0) return;
    setPendingDeleteSlideIndex(index);
  };

  const executePendingDeleteSlide = () => {
    const index = pendingDeleteSlideIndex;
    setPendingDeleteSlideIndex(null);
    if (index === null || slides.length === 0) return;
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    setCurrentIndex((ci) => {
      if (newSlides.length === 0) return 0;
      if (index < ci) return ci - 1;
      if (index === ci) return Math.min(ci, newSlides.length - 1);
      return ci;
    });
  };

  const updateActiveSlide = (updater: (slide: Slide) => void) => {
    if (slides.length === 0 || !slides[currentIndex]) return;
    const newSlides = [...slides];
    updater(newSlides[currentIndex]);
    setSlides(newSlides);
  };

  const applyTemplateSlides = () => {
    setSlides(cloneDefaultSlides());
    setCurrentIndex(0);
  };

  const requestLoadTemplateSlides = () => {
    if (slides.length === 0) {
      applyTemplateSlides();
      return;
    }
    setTemplateLoadConfirmSlideCount(slides.length);
    setTemplateLoadConfirmOpen(true);
  };

  const confirmLoadTemplateSlides = () => {
    applyTemplateSlides();
    setTemplateLoadConfirmOpen(false);
  };

  const downloadJson = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadText = (text: string, filename: string, type: string) => {
    const blob = new Blob([text], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportActiveProjectJson = () => {
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(activeProject, `vode-project-${safeDownloadNamePart(activeProject.title)}-${date}.json`);
  };

  const exportAllProjectsJson = () => {
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(projects, `vode-all-projects-backup-${date}.json`);
  };

  const canUseSlideCsv = activeSlide?.type === 'list' || activeSlide?.type === 'schedule';

  const exportActiveSlideCsv = () => {
    if (!activeSlide) return;
    const date = new Date().toISOString().slice(0, 10);
    const slideName = safeDownloadNamePart(activeSlide.headerTitle || activeSlide.type);
    if (activeSlide.type === 'list') {
      downloadText(exportListSlideCsv(activeSlide), `vode-list-${slideName}-${date}.csv`, 'text/csv;charset=utf-8');
      return;
    }
    if (activeSlide.type === 'schedule') {
      downloadText(exportScheduleSlideCsv(activeSlide), `vode-schedule-${slideName}-${date}.csv`, 'text/csv;charset=utf-8');
    }
  };

  const onImportCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!canUseSlideCsv || !activeSlide || (activeSlide.type !== 'list' && activeSlide.type !== 'schedule')) {
      setToast({ message: 'CSV 読み込みはリストまたはスケジュールのスライドで利用できます。', variant: 'error' });
      return;
    }
    if (file.size > MAX_IMPORT_CSV_BYTES) {
      setToast({
        message: `CSV ファイルが大きすぎます（最大 ${Math.round(MAX_IMPORT_CSV_BYTES / 1_000_000)}MB まで）。`,
        variant: 'error',
      });
      return;
    }
    const fileName = file.name;
    file.text().then((text) => {
      if (activeSlide.type === 'list') {
        const parsed = parseListItemsCsv(text);
        if (parsed.ok === false) {
          setToast({ message: parsed.error, variant: 'error' });
          return;
        }
        setCsvImportConfirm({ kind: 'list', fileName, rows: parsed.rows });
        return;
      }
      const parsed = parseScheduleRowsCsv(text);
      if (parsed.ok === false) {
        setToast({ message: parsed.error, variant: 'error' });
        return;
      }
      setCsvImportConfirm({ kind: 'schedule', fileName, rows: parsed.rows });
    });
  };

  const applyCsvImport = (mode: 'append' | 'replace') => {
    if (!csvImportConfirm) return;
    const pending = csvImportConfirm;
    if (mode === 'append' && activeSlide?.type === 'list' && pending.kind === 'list') {
      if (activeSlide.items.length + pending.rows.length > MAX_LIST_ITEMS) {
        setToast({ message: `リスト項目は最大 ${MAX_LIST_ITEMS} 件までです。`, variant: 'error' });
        return;
      }
    }
    if (mode === 'append' && activeSlide?.type === 'schedule' && pending.kind === 'schedule') {
      if (activeSlide.rows.length + pending.rows.length > MAX_SCHEDULE_ROWS) {
        setToast({ message: `スケジュール行は最大 ${MAX_SCHEDULE_ROWS} 件までです。`, variant: 'error' });
        return;
      }
    }
    updateActiveSlide((s) => {
      if (pending.kind === 'list' && s.type === 'list') {
        s.items = mode === 'append' ? [...s.items, ...pending.rows] : pending.rows;
      }
      if (pending.kind === 'schedule' && s.type === 'schedule') {
        s.rows = mode === 'append' ? [...s.rows, ...pending.rows] : pending.rows;
      }
    });
    setCsvImportConfirm(null);
    setToast({
      message: `${pending.rows.length} 件を${mode === 'append' ? '末尾に追加' : '置き換え'}しました。`,
      variant: 'info',
    });
  };

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMPORT_JSON_BYTES) {
      setToast({
        message: `ファイルが大きすぎます（最大 ${Math.round(MAX_IMPORT_JSON_BYTES / 1_000_000)}MB まで）。`,
        variant: 'error',
      });
      e.target.value = '';
      return;
    }
    const fileName = file.name;
    file.text().then((text) => {
      e.target.value = '';
      const parsed = parseProjectImportJson(text);
      if (parsed) {
        setImportConfirm({ projects: parsed, fileName, mode: parsed.length === 1 ? 'single' : 'all' });
      } else {
        setToast({
          message:
            '読み込めませんでした。Vode が書き出した JSON か、スライドの形式・件数・文字数制限を確認してください。',
          variant: 'error',
        });
      }
    });
  };

  const confirmImportProjects = () => {
    if (!importConfirm) return;
    if (importConfirm.mode === 'single') {
      const imported = projectForNewImport(importConfirm.projects[0]!);
      setProjects((prev) => [imported, ...prev]);
      setActiveProjectId(imported.id);
      setCurrentIndex(0);
      setView('editor');
      setImportConfirm(null);
      setToast({ message: `「${imported.title}」を新規プロジェクトとして追加しました。`, variant: 'info' });
      return;
    }
    setProjects(importConfirm.projects);
    setActiveProjectId(importConfirm.projects[0]!.id);
    setCurrentIndex(0);
    setView('editor');
    setImportConfirm(null);
    setToast({ message: '全プロジェクトを復元しました。', variant: 'info' });
  };

  const replaceCurrentProjectFromImport = () => {
    if (!importConfirm || importConfirm.mode !== 'single') return;
    const replacement = projectForCurrentReplacement(importConfirm.projects[0]!, activeProjectId);
    setProjects((prev) => prev.map((p) => (p.id === activeProjectId ? replacement : p)));
    setCurrentIndex(0);
    setView('editor');
    setImportConfirm(null);
    setToast({ message: `現在のプロジェクトを「${replacement.title}」で置き換えました。`, variant: 'info' });
  };

  const cancelImportProjects = () => setImportConfirm(null);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragSourceRef = useRef<number | null>(null);
  const suppressRowClickUntilRef = useRef(0);

  const reorderSlides = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= slides.length || to >= slides.length) return;
    const newSlides = [...slides];
    const moved = newSlides[from];
    newSlides.splice(from, 1);
    newSlides.splice(to, 0, moved);
    setSlides(newSlides);
    setCurrentIndex((ci) => {
      if (ci === from) return to;
      if (from < ci && to >= ci) return ci - 1;
      if (from > ci && to <= ci) return ci + 1;
      return ci;
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragSourceRef.current = index;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    dragSourceRef.current = null;
    setDraggedIndex(null);
    setDragOverIndex(null);
    suppressRowClickUntilRef.current = Date.now() + 200;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const from = dragSourceRef.current;
    if (from === null || from === targetIndex) return;
    reorderSlides(from, targetIndex);
  };

  const CANVAS_INNER_PAD = 64;

  const canvasScale = useMemo(() => {
    if (slides.length === 0) return 1;
    if (canvasViewMode === 'actual') return 1;
    const pad = CANVAS_INNER_PAD;
    const { w, h } = canvasViewportSize;
    if (w < 120 || h < 60) return 1;
    return Math.min(1, (w - pad) / SLIDE_CANVAS_W, (h - pad) / SLIDE_CANVAS_H);
  }, [canvasViewMode, canvasViewportSize, slides.length]);

  useLayoutEffect(() => {
    if (view !== 'editor') return;
    const el = canvasViewportRef.current;
    if (!el) return;
    const apply = () => {
      const r = el.getBoundingClientRect();
      setCanvasViewportSize({ w: r.width, h: r.height });
    };
    apply();
    const ro = new ResizeObserver(() => {
      apply();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [view, rightPanelOpen, slides.length]);

  if (fbConfigured && authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FDFDFD] text-sm text-[#5b5c64]">
        認証状態を確認しています…
      </div>
    );
  }

  // 許可するメールアドレスのリスト
  const ALLOWED_EMAILS = [
    'milktea.the.prime.tasty@gmail.com',
    'kohei@fren.jp'
  ];

  if (fbConfigured && fbUser) {
    // ログインしているが許可されたメールアドレスではない場合
    if (!fbUser.email || !ALLOWED_EMAILS.includes(fbUser.email)) {
      return (
        <div className="flex h-screen flex-col items-center justify-center bg-[#FDFDFD] px-4 font-sans text-[#1C1C1E]">
          <div className="w-full max-w-md rounded-xl border border-[#5b5c64]/20 bg-[#FFFFFF] p-8 shadow-sm text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Search size={32} />
            </div>
            <h2 className="text-xl font-bold text-[#1C1C1E] mb-3">承認待ち、または権限がありません</h2>
            <p className="text-sm text-[#5b5c64] mb-6 leading-relaxed">
              現在、ログイン中のメールアドレス（<strong>{fbUser.email || '不明'}</strong>）は許可リストに含まれていません。<br /><br />
              ご利用いただくには、<strong>管理者に承認許可を申請してください。</strong>
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  void signOutUser();
                }}
                className="w-full py-2.5 bg-[#1C1C1E] text-white rounded-md text-sm font-medium hover:bg-[#5b5c64] transition-colors"
              >
                ログアウトして別のアカウントで試す
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  if (fbConfigured && !fbUser) {
    return <FirebaseLogin />;
  }

  if (fbConfigured && fbUser && !cloudHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FDFDFD] text-sm text-[#5b5c64]">
        クラウドと同期しています…
      </div>
    );
  }

  const toastEl = toast ? (
    <div
      role="alert"
      className={cn(
        'fixed bottom-6 left-1/2 z-[110] flex max-w-[min(100vw-2rem,28rem)] -translate-x-1/2 items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg',
        toast.variant === 'error'
          ? 'border-red-200 bg-red-50 text-red-950'
          : 'border-[#5b5c64]/25 bg-[#FFFFFF] text-[#1C1C1E]'
      )}
    >
      <p className="min-w-0 flex-1 leading-snug">{toast.message}</p>
      <button
        type="button"
        onClick={() => setToast(null)}
        className="shrink-0 rounded p-1 text-[#5b5c64] hover:bg-black/5 hover:text-[#1C1C1E]"
        aria-label="通知を閉じる"
      >
        ×
      </button>
    </div>
  ) : null;

  if (view === 'dashboard') {
    const filteredProjects = [...projects.filter((p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.company.toLowerCase().includes(searchQuery.toLowerCase())
    )].sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date.replace(/\./g, '/')).getTime() - new Date(a.date.replace(/\./g, '/')).getTime();
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      if (sortBy === 'slides') return b.slides.length - a.slides.length;
      return 0;
    });

    return (
      <>
      <div className="flex flex-col w-full h-screen bg-[#FDFDFD] font-sans text-[#1C1C1E]">
        {/* Dashboard Topbar */}
        <div className="h-16 border-b border-[#5b5c64]/20 flex items-center justify-between gap-4 px-6 sm:px-8 shrink-0 bg-[#FFFFFF]">
          <div className={cn(vodeBrandRowClass, 'min-h-10 max-w-[min(100%,32rem)]')}>
            <img
              src={vodeSymbolUrl}
              alt=""
              width={500}
              height={500}
              decoding="async"
              aria-hidden
              className={vodeSymbolDashboardClass}
            />
            <img
              src={vodeLogoUrl}
              alt="Vode"
              width={1000}
              height={360}
              decoding="async"
              className={vodeLogoImgClass}
            />
            {import.meta.env.DEV ? (
              <span
                className={cn(
                  'shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide',
                  fbConfigured ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-950'
                )}
                title="開発時のみ表示。6 つの VITE_FIREBASE_* が package.json と同じフォルダの .env.local に揃うと ON（ログイン画面が出ます）。"
              >
                Firebase {fbConfigured ? 'ON' : 'OFF'}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {fbConfigured ? (
              <button
                type="button"
                onClick={() => {
                  void signOutUser();
                }}
                className="text-sm font-medium text-[#5b5c64] transition-colors hover:text-[#1C1C1E]"
              >
                ログアウト
              </button>
            ) : null}
            <button
              type="button"
              onClick={createProject}
              className="px-4 py-2 bg-[#1C1C1E] text-[#FFFFFF] rounded text-sm hover:bg-[#5b5c64] transition-colors flex items-center gap-2 font-medium"
            >
              <Plus size={16} /> 新規プロジェクト作成
            </button>
          </div>
        </div>
        
        {/* Dashboard Content */}
        <div className="p-8 max-w-6xl mx-auto w-full flex-1 overflow-auto">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-black text-[#1C1C1E] tracking-tight">プロジェクト</h2>
              <p className="text-sm text-[#5b5c64] mt-1">検索・並べ替え・編集・複製・削除</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5b5c64]" />
                <input 
                  type="text" 
                  placeholder="プロジェクトや企業名で検索..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-[#5b5c64]/30 rounded-md text-sm min-w-[260px] bg-[#FFFFFF] focus:outline-none focus:border-[#1C1C1E] placeholder:text-[#5b5c64]/50"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === 'date' || v === 'name' || v === 'slides') setSortBy(v);
                }}
                className="py-2 px-3 border border-[#5b5c64]/30 rounded-md text-sm bg-[#FFFFFF] focus:outline-none focus:border-[#1C1C1E] text-[#5b5c64] cursor-pointer"
              >
                <option value="date">更新日順</option>
                <option value="name">名前順</option>
                <option value="slides">スライド数順</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredProjects.map((project) => {
               const thumbSrc = project.thumbnail.trim()
                 ? safeImageSrc(project.thumbnail)
                 : null;
               return (
               <div
                 key={project.id}
                 className="group flex flex-col overflow-hidden rounded-xl border border-[#5b5c64]/20 bg-[#FFFFFF] transition-all hover:border-[#1C1C1E] hover:shadow-sm"
               >
                 <button
                   type="button"
                   className="flex min-h-0 min-w-0 w-full flex-col p-5 pb-4 text-left transition-colors hover:bg-[#5b5c64]/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1C1C1E]/25"
                   onClick={() => {
                     setActiveProjectId(project.id);
                     setView('editor');
                   }}
                   aria-label={`${project.title} を編集で開く`}
                 >
                   <div className="mb-5 flex h-40 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#5b5c64]/10 bg-[#5b5c64]/5 transition-colors group-hover:bg-[#5b5c64]/10">
                     {thumbSrc ? (
                       <img
                         src={thumbSrc}
                         alt={`${project.title} のサムネイル`}
                         className="h-full w-full object-cover"
                         referrerPolicy="no-referrer"
                       />
                     ) : (
                       <FileText className="text-[#5b5c64]/50" size={40} aria-hidden />
                     )}
                   </div>
                   <div className="mb-2 min-w-0 w-full">
                     <h3 className="break-words text-lg font-bold leading-snug text-[#1C1C1E] [overflow-wrap:anywhere]">
                       {project.title}
                     </h3>
                   </div>
                   <p className="min-w-0 truncate text-sm font-medium text-[#5b5c64]">{project.company}</p>
                 </button>
                 <div className="flex flex-col gap-3 border-t border-[#5b5c64]/10 px-5 py-4 text-xs text-[#5b5c64]">
                   <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
                     <span className="min-w-0 max-w-full shrink font-medium leading-snug [overflow-wrap:anywhere]">
                       最終更新: {project.date}
                     </span>
                     <span
                       className={cn(
                         'shrink-0 whitespace-nowrap rounded px-2 py-1 text-[11px] font-medium',
                         project.slides.length === 0
                           ? 'border border-amber-200/80 bg-amber-50 text-amber-900'
                           : 'bg-[#5b5c64]/10 text-[#5b5c64]'
                       )}
                     >
                       {project.slides.length === 0 ? 'スライドなし' : `${project.slides.length} 枚`}
                     </span>
                   </div>
                   <div className="flex min-w-0 flex-wrap items-center gap-2">
                     <button
                       type="button"
                       className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[#5b5c64]/25 bg-[#FFFFFF] px-2 py-1.5 text-[11px] font-medium text-[#1C1C1E] shadow-sm transition-colors hover:border-[#1C1C1E] hover:bg-[#1C1C1E] hover:text-[#FFFFFF] disabled:pointer-events-none disabled:opacity-40 disabled:hover:bg-[#FFFFFF] disabled:hover:text-[#1C1C1E]"
                       title="全スライドを連続プレビュー（モーダルで開きます）"
                       aria-label={`${project.title} をプレビュー`}
                       disabled={project.slides.length === 0}
                       onClick={() => openProjectPreview(project, 0)}
                     >
                       <Presentation size={14} className="shrink-0" aria-hidden />
                       <span className="hidden min-[380px]:inline">プレビュー</span>
                     </button>
                     <button
                       type="button"
                       className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[#5b5c64]/25 bg-[#FFFFFF] px-2 py-1.5 text-[11px] font-medium text-[#1C1C1E] shadow-sm transition-colors hover:border-[#1C1C1E] hover:bg-[#5b5c64]/10"
                       title="このプロジェクトを複製（新規プロジェクトとしてコピー。標準テンプレのベースに使えます）"
                       aria-label={`${project.title} を複製`}
                       onClick={(e) => {
                         e.stopPropagation();
                         duplicateProjectFromDashboard(project);
                       }}
                     >
                       <Copy size={14} className="shrink-0" aria-hidden />
                       <span className="hidden min-[380px]:inline">複製</span>
                     </button>
                     <button
                       type="button"
                       className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-200/90 bg-[#FFFFFF] px-2 py-1.5 text-[11px] font-medium text-red-800 shadow-sm transition-colors hover:border-red-700 hover:bg-red-700 hover:text-[#FFFFFF] disabled:pointer-events-none disabled:opacity-40 disabled:hover:border-red-200/90 disabled:hover:bg-[#FFFFFF] disabled:hover:text-red-800"
                       title={
                         projects.length <= 1
                           ? 'プロジェクトが 1 件のときは削除できません'
                           : 'このプロジェクトを削除'
                       }
                       aria-label={`${project.title} を削除`}
                       disabled={projects.length <= 1}
                       onClick={(e) => {
                         e.stopPropagation();
                         requestDeleteProject(project);
                       }}
                     >
                       <Trash2 size={14} className="shrink-0" aria-hidden />
                       <span className="hidden min-[380px]:inline">削除</span>
                     </button>
                   </div>
                 </div>
               </div>
               );
             })}
          </div>
        </div>
      </div>
      <ProjectPreviewModal
        open={Boolean(previewProject && previewProject.slides.length > 0)}
        project={previewProject}
        slideIndex={previewSlideIndex}
        onSlideIndexChange={setPreviewSlideIndex}
        onClose={closeProjectPreview}
        onPrint={handlePrint}
      />
      <DeleteProjectConfirmModal
        open={pendingDeleteProjectId !== null && pendingDeleteProject !== null}
        project={pendingDeleteProject}
        onClose={() => setPendingDeleteProjectId(null)}
        onConfirm={executePendingDeleteProject}
      />
      {toastEl}
      </>
    );
  }

  return (
    <>
    <div className="flex h-screen bg-[#FFFFFF] text-[#1C1C1E] overflow-hidden font-sans print:overflow-visible">
      
      {/* Sidebar - Slide List (Hidden when printing) */}
      <div className="w-64 bg-[#FFFFFF] border-r border-[#5b5c64]/20 flex flex-col print:hidden z-20 shadow-sm">
        <div className="border-b border-[#5b5c64]/20 px-3 py-3 sm:px-4">
          <div className={cn(vodeBrandRowClass, 'min-h-10')}>
            <img
              src={vodeSymbolUrl}
              alt=""
              width={500}
              height={500}
              decoding="async"
              aria-hidden
              className={vodeSymbolSidebarClass}
            />
            <img
              src={vodeLogoUrl}
              alt="Vode"
              width={1000}
              height={360}
              decoding="async"
              className={vodeLogoSidebarClass}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col min-h-0">
          <p className="mb-2 shrink-0 text-[11px] leading-snug text-[#5b5c64] sm:text-xs">
            {slides.length > 0 ? (
              <>
                左の︙をドラッグするか、↑↓で順番を変更できます。右の複製アイコンでスライドを複製できます。
                <span className="mt-1 block text-[#5b5c64]/90">
                  タッチ端末ではドラッグが効かないことがあります。そのときは ↑↓ を使ってください。
                </span>
              </>
            ) : (
              '下からスライドを追加するか、テンプレートを読み込んでください。'
            )}
          </p>
          {slides.length > 0 && (
            <button
              type="button"
              onClick={() => openProjectPreview(activeProject, currentIndex)}
              className="mb-2 flex w-full shrink-0 items-center justify-center gap-1.5 rounded-md border border-[#5b5c64]/25 py-2 text-xs font-medium text-[#1C1C1E] transition-colors hover:bg-[#5b5c64]/10"
            >
              <Presentation size={14} />
              資料全体をプレビュー
            </button>
          )}
          <div className="space-y-1.5">
          {slides.map((slide, i) => (
            <div 
              key={slide.id}
              onClick={() => {
                if (Date.now() < suppressRowClickUntilRef.current) return;
                setCurrentIndex(i);
              }}
              onDragOver={(e) => {
                handleDragOver(e);
                if (dragSourceRef.current !== null && dragSourceRef.current !== i) {
                  setDragOverIndex((prev) => (prev === i ? prev : i));
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverIndex((prev) => (prev === i ? null : prev));
                }
              }}
              onDrop={(e) => handleDrop(e, i)}
              className={cn(
                "group flex items-stretch gap-1.5 pl-1 pr-1.5 py-1.5 rounded-lg cursor-pointer transition-all border select-none",
                currentIndex === i ? "bg-[#5b5c64]/10 border-[#1C1C1E]" : "bg-[#FFFFFF] border-[#5b5c64]/20 hover:bg-[#5b5c64]/5",
                draggedIndex === i && "opacity-40",
                dragOverIndex === i && draggedIndex !== null && draggedIndex !== i && "ring-2 ring-[#1C1C1E]/20 border-[#1C1C1E]/35"
              )}
            >
              <div
                role="button"
                tabIndex={0}
                aria-label={`スライド ${i + 1} をドラッグして並べ替え`}
                draggable
                onClick={(e) => e.stopPropagation()}
                onDragStart={(e) => handleDragStart(e, i)}
                onDragEnd={handleDragEnd}
                className="shrink-0 flex items-center justify-center w-9 rounded-md text-[#5b5c64] hover:bg-[#5b5c64]/15 hover:text-[#1C1C1E] cursor-grab active:cursor-grabbing touch-none"
                style={{ touchAction: 'none' }}
              >
                <GripVertical size={18} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-center">
                <div className="text-xs font-medium text-[#5b5c64] tabular-nums">{i + 1}</div>
                <div className="text-sm font-medium text-[#1C1C1E] truncate leading-tight">{slide.headerTitle || slide.type}</div>
                <div className="text-xs text-[#5b5c64]">{SLIDE_TYPE_LABELS[slide.type]}</div>
              </div>
              <div className="flex flex-col justify-center gap-0 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  disabled={i === 0}
                  aria-label="上へ移動"
                  onClick={() => reorderSlides(i, i - 1)}
                  className="p-0.5 rounded text-[#5b5c64] hover:bg-[#5b5c64]/15 hover:text-[#1C1C1E] disabled:opacity-25 disabled:pointer-events-none"
                >
                  <ChevronUp size={16} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  disabled={i === slides.length - 1}
                  aria-label="下へ移動"
                  onClick={() => reorderSlides(i, i + 1)}
                  className="p-0.5 rounded text-[#5b5c64] hover:bg-[#5b5c64]/15 hover:text-[#1C1C1E] disabled:opacity-25 disabled:pointer-events-none"
                >
                  <ChevronDown size={16} strokeWidth={2.5} />
                </button>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateSlideAt(i);
                }}
                className="self-center shrink-0 rounded-md p-1.5 text-[#5b5c64] opacity-70 transition-opacity hover:bg-[#5b5c64]/10 hover:text-[#1C1C1E] group-hover:opacity-100"
                title="このスライドを複製（直下にコピーを挿入）"
                aria-label={`スライド ${i + 1} を複製`}
              >
                <Copy size={15} aria-hidden />
              </button>
              <button 
                type="button"
                onClick={(e) => requestRemoveSlide(i, e)}
                className="self-center shrink-0 p-1.5 rounded-md text-[#5b5c64] hover:bg-red-50 hover:text-red-700 opacity-70 group-hover:opacity-100 transition-opacity"
                aria-label="スライドを削除"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          </div>
        </div>

        <div className="p-4 border-t border-[#5b5c64]/20 space-y-3">
          <button
            type="button"
            onClick={() => setCopySlidesModalOpen(true)}
            disabled={slides.length === 0 || otherProjectsForCopy.length === 0}
            title={
              otherProjectsForCopy.length === 0
                ? 'コピー先になる別のプロジェクトがありません'
                : '選択したスライドを別プロジェクトの末尾にコピー'
            }
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#5b5c64]/25 bg-[#FFFFFF] px-2 py-2.5 text-xs font-medium text-[#1C1C1E] transition-colors hover:border-[#1C1C1E] hover:bg-[#5b5c64]/10 disabled:pointer-events-none disabled:opacity-40"
          >
            <ArrowRightLeft size={16} className="shrink-0" aria-hidden />
            他プロジェクトへコピー
          </button>
          <button
            type="button"
            onClick={requestLoadTemplateSlides}
            className="w-full flex items-center justify-center gap-2 text-xs py-2.5 px-2 rounded-lg border border-dashed border-[#5b5c64]/40 text-[#5b5c64] hover:bg-[#5b5c64]/10 hover:text-[#1C1C1E] hover:border-[#1C1C1E]/30 transition-colors font-medium"
          >
            <LayoutTemplate size={16} />
            テンプレートを読み込む
          </button>
          <div className="text-xs font-semibold text-[#5b5c64]">スライド追加</div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => addSlide('concept')} className="rounded-md border border-[#5b5c64]/20 bg-[#FFFFFF] p-2.5 text-xs font-medium text-[#1C1C1E] transition-colors hover:bg-[#5b5c64]/10">コンセプト</button>
            <button type="button" onClick={() => addSlide('grid')} className="rounded-md border border-[#5b5c64]/20 bg-[#FFFFFF] p-2.5 text-xs font-medium text-[#1C1C1E] transition-colors hover:bg-[#5b5c64]/10">グリッド</button>
            <button type="button" onClick={() => addSlide('split')} className="rounded-md border border-[#5b5c64]/20 bg-[#FFFFFF] p-2.5 text-xs font-medium text-[#1C1C1E] transition-colors hover:bg-[#5b5c64]/10">分割</button>
            <button type="button" onClick={() => addSlide('schedule')} className="rounded-md border border-[#5b5c64]/20 bg-[#FFFFFF] p-2.5 text-xs font-medium text-[#1C1C1E] transition-colors hover:bg-[#5b5c64]/10">スケジュール</button>
            <button type="button" onClick={() => addSlide('list')} className="rounded-md border border-[#5b5c64]/20 bg-[#FFFFFF] p-2.5 text-xs font-medium text-[#1C1C1E] transition-colors hover:bg-[#5b5c64]/10">リスト</button>
            <button type="button" onClick={() => addSlide('custom')} className="rounded-md border border-[#5b5c64]/20 bg-[#FFFFFF] p-2.5 text-xs font-medium text-[#1C1C1E] transition-colors hover:bg-[#5b5c64]/10">カスタム</button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full bg-[#5b5c64]/5 print:bg-[#FFFFFF] overflow-hidden print:overflow-visible">
        
        {/* Top Navbar (Hidden when printing) */}
        <div className="h-14 bg-[#FFFFFF] border-b border-[#5b5c64]/20 flex items-center justify-between px-4 sm:px-6 print:hidden z-10 shrink-0 gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onImportFile}
          />
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={onImportCsvFile}
          />
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button 
              type="button"
              onClick={() => setView('dashboard')} 
              className="p-1.5 shrink-0 text-[#5b5c64] hover:bg-[#5b5c64]/10 hover:text-[#1C1C1E] rounded transition-colors flex items-center gap-1 text-sm font-medium border border-transparent hover:border-[#5b5c64]/20"
              title="ダッシュボードに戻る"
              aria-label="ダッシュボードに戻る"
            >
              <ArrowLeft size={16} aria-hidden />
              <span className="hidden sm:inline" aria-hidden>
                ダッシュボード
              </span>
            </button>
            {fbConfigured ? (
              <button
                type="button"
                onClick={() => {
                  void signOutUser();
                }}
                className="hidden shrink-0 text-xs font-medium text-[#5b5c64] transition-colors hover:text-[#1C1C1E] sm:inline"
              >
                ログアウト
              </button>
            ) : null}
            <div className="w-px h-6 bg-[#5b5c64]/20 shrink-0 hidden sm:block" />
            <button 
              type="button"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={slides.length === 0 || currentIndex === 0}
              className="p-1 rounded hover:bg-[#5b5c64]/10 disabled:opacity-40 text-[#1C1C1E] shrink-0"
              aria-label="前のスライド"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium text-[#5b5c64] tabular-nums truncate">
              {slides.length === 0
                ? 'スライドなし'
                : `${currentIndex + 1} / ${slides.length}`}
            </span>
            <button 
              type="button"
              onClick={() => setCurrentIndex(Math.min(slides.length - 1, currentIndex + 1))}
              disabled={slides.length === 0 || currentIndex >= slides.length - 1}
              className="p-1 rounded hover:bg-[#5b5c64]/10 disabled:opacity-40 text-[#1C1C1E] shrink-0"
              aria-label="次のスライド"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setRightPanelOpen((open) => {
                  const next = !open;
                  writeSessionRightPanelOpen(next);
                  return next;
                });
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 border border-[#5b5c64]/25 text-[#1C1C1E] text-xs sm:text-sm font-medium rounded-md hover:bg-[#5b5c64]/10 transition-colors"
              title={rightPanelOpen ? '右の編集パネルを閉じてキャンバスを広げる' : '右の編集パネルを開く'}
              aria-expanded={rightPanelOpen}
              aria-label={rightPanelOpen ? '右の編集パネルを閉じる' : '右の編集パネルを開く'}
            >
              {rightPanelOpen ? (
                <PanelRightClose size={16} className="shrink-0" aria-hidden />
              ) : (
                <PanelRightOpen size={16} className="shrink-0" aria-hidden />
              )}
              <span className="hidden md:inline" aria-hidden>
                パネル
              </span>
            </button>
            <button
              type="button"
              onClick={() => openProjectPreview(activeProject, currentIndex)}
              disabled={slides.length === 0}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 border border-[#5b5c64]/25 text-[#1C1C1E] text-xs sm:text-sm font-medium rounded-md hover:bg-[#5b5c64]/10 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              title="このプロジェクトの全スライドを連続表示"
              aria-label="全資料プレビュー（連続表示）"
            >
              <Presentation size={16} className="shrink-0" aria-hidden />
              <span className="hidden md:inline" aria-hidden>
                全資料プレビュー
              </span>
            </button>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 border border-[#5b5c64]/25 text-[#1C1C1E] text-xs sm:text-sm font-medium rounded-md hover:bg-[#5b5c64]/10 transition-colors"
              title="JSON を読み込み（通常は新しいプロジェクトとして追加）"
              aria-label="プロジェクト JSON を読み込み"
            >
              <Upload size={16} className="shrink-0" aria-hidden />
              <span className="hidden md:inline" aria-hidden>
                読み込み
              </span>
            </button>
            {canUseSlideCsv ? (
              <>
                <button
                  type="button"
                  onClick={() => csvInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 border border-[#5b5c64]/25 text-[#1C1C1E] text-xs sm:text-sm font-medium rounded-md hover:bg-[#5b5c64]/10 transition-colors"
                  title="現在のリスト／スケジュールスライドに CSV を読み込み"
                  aria-label="CSV を読み込み"
                >
                  <Upload size={16} className="shrink-0" aria-hidden />
                  <span className="hidden md:inline" aria-hidden>
                    CSV読込
                  </span>
                </button>
                <button
                  type="button"
                  onClick={exportActiveSlideCsv}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 border border-[#5b5c64]/25 text-[#1C1C1E] text-xs sm:text-sm font-medium rounded-md hover:bg-[#5b5c64]/10 transition-colors"
                  title="現在のリスト／スケジュールスライドを CSV で書き出し"
                  aria-label="CSV で書き出し"
                >
                  <FileDown size={16} className="shrink-0" aria-hidden />
                  <span className="hidden md:inline" aria-hidden>
                    CSV出力
                  </span>
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={exportActiveProjectJson}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 border border-[#5b5c64]/25 text-[#1C1C1E] text-xs sm:text-sm font-medium rounded-md hover:bg-[#5b5c64]/10 transition-colors"
              title="開いているプロジェクトだけを JSON で保存"
              aria-label="現在のプロジェクトを JSON で書き出し"
            >
              <FileDown size={16} className="shrink-0" aria-hidden />
              <span className="hidden md:inline" aria-hidden>
                書き出し
              </span>
            </button>
            <button
              type="button"
              onClick={exportAllProjectsJson}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 border border-[#5b5c64]/25 text-[#1C1C1E] text-xs sm:text-sm font-medium rounded-md hover:bg-[#5b5c64]/10 transition-colors"
              title="すべてのプロジェクトをバックアップ JSON として保存"
              aria-label="全プロジェクトをバックアップ"
            >
              <FileDown size={16} className="shrink-0" aria-hidden />
              <span className="hidden md:inline" aria-hidden>
                全体バックアップ
              </span>
            </button>
            <button 
              type="button"
              onClick={handlePrint}
              disabled={slides.length === 0}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#1C1C1E] text-[#FFFFFF] text-xs sm:text-sm font-medium rounded-md hover:bg-[#5b5c64] transition-colors disabled:opacity-40 disabled:pointer-events-none"
              title="ブラウザの印刷ダイアログを開きます。「PDF に保存」で保存。用紙は A4 横、1 枚＝1 スライドが用紙いっぱいに収まるようレイアウトしています。印刷の余白は「なし」にするとずれが少なくなります。"
              aria-label="印刷または PDF（ブラウザの印刷ダイアログ）"
            >
              <Download size={16} aria-hidden />
              <span className="hidden md:inline" aria-hidden>
                PDF
              </span>
            </button>
          </div>
        </div>

        {/* Workspace + right panel: row on screen; print still flows */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden print:block print:overflow-visible">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden print:overflow-visible">
            {slides.length > 0 ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#5b5c64]/15 bg-[#FFFFFF] px-3 py-2 sm:px-4 print:hidden">
                <span className="text-xs font-medium text-[#5b5c64]">キャンバス</span>
                <button
                  type="button"
                  onClick={() => {
                    setCanvasViewMode('fit');
                    writeSessionCanvasMode('fit');
                  }}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    canvasViewMode === 'fit'
                      ? 'bg-[#1C1C1E] text-[#FFFFFF]'
                      : 'text-[#1C1C1E] hover:bg-[#5b5c64]/10'
                  )}
                >
                  画面に合わせ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCanvasViewMode('actual');
                    writeSessionCanvasMode('actual');
                  }}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    canvasViewMode === 'actual'
                      ? 'bg-[#1C1C1E] text-[#FFFFFF]'
                      : 'text-[#1C1C1E] hover:bg-[#5b5c64]/10'
                  )}
                >
                  実寸（100%）
                </button>
              </div>
            ) : null}
            <div
              ref={canvasViewportRef}
              className="flex min-h-0 w-full flex-1 flex-col overflow-auto print:overflow-visible"
            >
              <div className="box-border flex w-full min-w-0 flex-1 flex-col items-center justify-start p-8 pb-24 print:block print:p-0 print:m-0 print:overflow-visible">
                <div className="print:hidden">
                  {slides.length === 0 ? (
                    <div
                      className="bg-[#FFFFFF] shadow-[0_4px_30px_rgba(0,0,0,0.1)] relative flex flex-col items-center justify-center border border-[#5b5c64]/20"
                      style={{ width: `min(100%, ${SLIDE_CANVAS_W}px)`, minHeight: '420px' }}
                    >
                      <div className="px-8 py-16 text-center max-w-md">
                        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[#5b5c64]/10 flex items-center justify-center text-[#5b5c64]">
                          <FileText size={28} />
                        </div>
                        <h2 className="text-lg font-bold text-[#1C1C1E] mb-2">スライドがありません</h2>
                        <p className="text-sm text-[#5b5c64] leading-relaxed mb-6">
                          左のパネルから種類を選んで追加するか、テンプレートをまとめて読み込めます。
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <button
                            type="button"
                            onClick={() => addSlide('concept')}
                            className="px-4 py-2.5 rounded-lg bg-[#1C1C1E] text-[#FFFFFF] text-sm font-medium hover:bg-[#5b5c64] transition-colors"
                          >
                            最初のスライドを追加
                          </button>
                          <button
                            type="button"
                            onClick={requestLoadTemplateSlides}
                            className="px-4 py-2.5 rounded-lg border border-[#5b5c64]/30 text-sm font-medium text-[#1C1C1E] hover:bg-[#5b5c64]/10 transition-colors"
                          >
                            テンプレートを読み込む
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : activeSlide ? (
                    <div
                      className="relative shrink-0 border border-[#5b5c64]/20 bg-[#FFFFFF] shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
                      style={{
                        width: SLIDE_CANVAS_W * canvasScale,
                        height: SLIDE_CANVAS_H * canvasScale,
                      }}
                    >
                      <div
                        style={{
                          width: SLIDE_CANVAS_W,
                          height: SLIDE_CANVAS_H,
                          transform: `scale(${canvasScale})`,
                          transformOrigin: 'top left',
                        }}
                      >
                        <SlideRenderer
                          slide={activeSlide}
                          globalSettings={{ creationDate, targetCompany }}
                          onCanvasEdit={updateActiveSlide}
                          canvasFieldLink={slideFieldLink}
                          linkedFieldId={linkedCanvasFieldId}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div
                  className={cn(
                    'hidden w-full',
                    previewProjectId ? 'print:hidden' : 'print:block'
                  )}
                >
                  {slides.map((slide) => (
                    <React.Fragment key={slide.id}>
                      <SlideRenderer slide={slide} globalSettings={{ creationDate, targetCompany }} />
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Editor Sidebar (Hidden when printing) */}
          {rightPanelOpen ? (
          <div className="flex w-80 shrink-0 flex-col overflow-y-auto border-l border-[#5b5c64]/20 bg-[#FFFFFF] shadow-sm print:hidden z-10">
             
             {/* Global settings section */}
             <div className="p-4 border-b border-[#5b5c64]/20 bg-[#5b5c64]/5">
               <h2 className="font-bold text-[#1C1C1E] mb-1 text-sm">プロジェクト設定（全スライド共通）</h2>
               <p className="mb-4 text-xs leading-snug text-[#5b5c64]">
                 変更はこのブラウザ（localStorage）に自動保存されます。
                 {fbConfigured ? ' ログイン中は Firestore にも同期されます。' : ''}
               </p>
               <div className="space-y-3">
                 <div className="space-y-1">
                   <label className="text-xs font-medium text-[#5b5c64]">作成日</label>
                   <input 
                     type="text" 
                     value={creationDate} 
                     onChange={e => updateProjectDetails({ date: e.target.value })}
                     className="w-full border border-[#5b5c64]/30 rounded px-2 py-1.5 text-xs text-[#1C1C1E] bg-[#FFFFFF] focus:outline-none focus:border-[#1C1C1E]"
                   />
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs font-medium text-[#5b5c64]">提出先（会社名）</label>
                   <input 
                     type="text" 
                     value={targetCompany} 
                     onChange={e => updateProjectDetails({ company: e.target.value })}
                     className="w-full border border-[#5b5c64]/30 rounded px-2 py-1.5 text-xs text-[#1C1C1E] bg-[#FFFFFF] focus:outline-none focus:border-[#1C1C1E]"
                   />
                 </div>
                 <ImageSourceField
                   label="サムネイル（任意・URL またはファイル）"
                   value={activeProject.thumbnail}
                   onChange={(next) => updateProjectDetails({ thumbnail: next })}
                   onBlurCommit={(raw) =>
                     updateProjectDetails({ thumbnail: normalizeImageFieldValue(raw) })
                   }
                   hint="ダッシュボードのカードに表示されます。大きい画像は JSON / クラウド保存のサイズに影響します。"
                   reportError={(m) => setToast({ message: m, variant: 'error' })}
                 />
               </div>
             </div>

             <div className="p-4 border-b border-[#5b5c64]/20">
               <h2 className="font-bold text-[#1C1C1E]">スライドを編集</h2>
             </div>
             <div className="p-4 space-y-4">
                {activeSlide ? (
                  <>
                    <EditorField fieldId={CF.headerTitle} linkedFieldId={linkedCanvasFieldId} fieldLink={slideFieldLink}>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-[#5b5c64]">ヘッダータイトル</label>
                        <input
                          type="text"
                          value={activeSlide.headerTitle}
                          onChange={(e) => updateActiveSlide((s) => { s.headerTitle = e.target.value; })}
                          className="w-full border border-[#5b5c64]/30 rounded px-3 py-2 text-sm text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E] focus:ring-1 focus:ring-[#1C1C1E]/20"
                        />
                      </div>
                    </EditorField>
                    {activeSlide.type === 'concept' && (
                      <ConceptEditor
                        slide={activeSlide}
                        update={updateActiveSlide}
                        linkedCanvasFieldId={linkedCanvasFieldId}
                        fieldLink={slideFieldLink}
                        reportError={(m) => setToast({ message: m, variant: 'error' })}
                      />
                    )}
                    {activeSlide.type === 'grid' && (
                      <GridEditor
                        slide={activeSlide}
                        update={updateActiveSlide}
                        linkedCanvasFieldId={linkedCanvasFieldId}
                        fieldLink={slideFieldLink}
                        reportError={(m) => setToast({ message: m, variant: 'error' })}
                      />
                    )}
                    {activeSlide.type === 'split' && (
                      <SplitEditor
                        slide={activeSlide}
                        update={updateActiveSlide}
                        linkedCanvasFieldId={linkedCanvasFieldId}
                        fieldLink={slideFieldLink}
                        reportError={(m) => setToast({ message: m, variant: 'error' })}
                      />
                    )}
                    {activeSlide.type === 'schedule' && (
                      <ScheduleEditor
                        slide={activeSlide}
                        update={updateActiveSlide}
                        linkedCanvasFieldId={linkedCanvasFieldId}
                        fieldLink={slideFieldLink}
                        reportError={(m) => setToast({ message: m, variant: 'error' })}
                      />
                    )}
                    {activeSlide.type === 'list' && (
                      <ListEditor
                        slide={activeSlide}
                        update={updateActiveSlide}
                        linkedCanvasFieldId={linkedCanvasFieldId}
                        fieldLink={slideFieldLink}
                        reportError={(m) => setToast({ message: m, variant: 'error' })}
                      />
                    )}
                    {activeSlide.type === 'custom' && (
                      <CustomEditor
                        slide={activeSlide}
                        update={updateActiveSlide}
                        linkedCanvasFieldId={linkedCanvasFieldId}
                        fieldLink={slideFieldLink}
                        reportError={(m) => setToast({ message: m, variant: 'error' })}
                      />
                    )}
                  </>
                ) : (
                  <p className="text-sm text-[#5b5c64] leading-relaxed">
                    スライドを追加すると、ここで内容を編集できます。
                  </p>
                )}
             </div>
          </div>
          ) : null}
        </div>
      </div>
    </div>
    <ImportProjectsConfirmModal
      open={importConfirm !== null}
      fileName={importConfirm?.fileName ?? null}
      projectCount={importConfirm?.projects.length ?? 0}
      projectTitle={importConfirm?.projects[0]?.title ?? null}
      mode={importConfirm?.mode ?? 'single'}
      onClose={cancelImportProjects}
      onConfirm={confirmImportProjects}
      onReplaceCurrent={replaceCurrentProjectFromImport}
    />
    <ImportCsvConfirmModal
      open={csvImportConfirm !== null}
      fileName={csvImportConfirm?.fileName ?? null}
      kind={csvImportConfirm?.kind ?? 'list'}
      rowCount={csvImportConfirm?.rows.length ?? 0}
      onClose={() => setCsvImportConfirm(null)}
      onAppend={() => applyCsvImport('append')}
      onReplace={() => applyCsvImport('replace')}
    />
    <DeleteSlideConfirmModal
      open={
        pendingDeleteSlideIndex !== null &&
        pendingDeleteSlideIndex >= 0 &&
        pendingDeleteSlideIndex < slides.length
      }
      slideLabel={
        pendingDeleteSlideIndex !== null && slides[pendingDeleteSlideIndex]
          ? slides[pendingDeleteSlideIndex]!.headerTitle?.trim() ||
            SLIDE_TYPE_LABELS[slides[pendingDeleteSlideIndex]!.type] ||
            `スライド ${pendingDeleteSlideIndex + 1}`
          : ''
      }
      onClose={() => setPendingDeleteSlideIndex(null)}
      onConfirm={executePendingDeleteSlide}
    />
    <CopySlidesToProjectModal
      open={copySlidesModalOpen}
      onClose={() => setCopySlidesModalOpen(false)}
      slides={slides}
      otherProjects={otherProjectsForCopy}
      maxSlidesPerProject={MAX_SLIDES_PER_PROJECT}
      onConfirm={handleCopySlidesToProjectConfirm}
    />
    <LoadTemplateConfirmModal
      open={templateLoadConfirmOpen}
      currentSlideCount={templateLoadConfirmSlideCount}
      onClose={() => setTemplateLoadConfirmOpen(false)}
      onConfirm={confirmLoadTemplateSlides}
    />
    <ProjectPreviewModal
      open={Boolean(previewProject && previewProject.slides.length > 0)}
      project={previewProject}
      slideIndex={previewSlideIndex}
      onSlideIndexChange={setPreviewSlideIndex}
      onClose={closeProjectPreview}
      onPrint={handlePrint}
    />
    {toastEl}
    </>
  );
}
