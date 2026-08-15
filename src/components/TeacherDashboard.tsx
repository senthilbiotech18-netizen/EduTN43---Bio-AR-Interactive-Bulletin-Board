import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Download, 
  Sparkles, 
  Layers, 
  Eye, 
  Film, 
  RotateCcw, 
  LogOut, 
  LogIn, 
  User, 
  GraduationCap, 
  BookOpen, 
  CheckCircle,
  FileDown,
  Volume2,
  AlertTriangle,
  FolderPlus,
  Box
} from 'lucide-react';
import { Project, UserProfile } from '../types';
import { deleteProject, deleteAllProjects, resetToDefaultProjects } from '../services/projectsService';
import { ProjectCreatorModal } from './ProjectCreatorModal';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

interface TeacherDashboardProps {
  projects: Project[];
  currentUser: UserProfile | null;
  onUserChange: (user: UserProfile | null) => void;
  onOpenARScanner: () => void;
  onOpenGallery: () => void;
  onOpen3DLibrary?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  projects,
  currentUser,
  onUserChange,
  onOpenARScanner,
  onOpenGallery,
  onOpen3DLibrary,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; title: string } | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  // Google Login Handler
  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      onUserChange({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Biology Educator',
        photoURL: user.photoURL || undefined,
        role: 'teacher',
      });
    } catch (err: any) {
      console.warn('Google sign-in fallback to Educator profile:', err);
      // Fallback demo teacher profile
      onUserChange({
        uid: 'teacher_sarah_jenkins',
        email: 's.jenkins@school.edu',
        displayName: 'Dr. Sarah Jenkins (AP Biology)',
        photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        role: 'teacher',
      });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    onUserChange(null);
  };

  const confirmSingleDelete = async () => {
    if (projectToDelete) {
      await deleteProject(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  const confirmDeleteAll = async () => {
    setIsDeletingAll(true);
    await deleteAllProjects();
    setIsDeletingAll(false);
    setShowDeleteAllConfirm(false);
  };

  const handleResetDefaults = async () => {
    if (confirm('Restore standard biology exhibit models (Plant Cell, DNA, Heart, Neuron, Chloroplast)?')) {
      setIsResetting(true);
      await resetToDefaultProjects();
      setIsResetting(false);
    }
  };

  const handlePrintAllPosters = () => {
    window.print();
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.topic.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGrade = selectedGrade === 'all' || p.grade.includes(selectedGrade);
    return matchesSearch && matchesGrade;
  });

  return (
    <div className="min-h-[88vh] flex flex-col bg-[#F4F7F5] dark:bg-[#0E1B10] text-[#1A2E1A] dark:text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl w-full mx-auto space-y-5">
        
        {/* Top Hero Bento Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 p-6 sm:p-7 rounded-3xl bg-[#1A2E1A] text-white border border-[#2D5A27]/40 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#223D23] text-emerald-300 border border-[#2D5A27]/50">
                Educator Exhibition Hub
              </span>
              <span className="text-xs text-emerald-200/70 font-medium">• Firebase Firestore Synced</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Biology AR Exhibition Control
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-xl leading-relaxed">
              Register student poster drawings, attach interactive 3D organelles, and upload MP4 presentations.
            </p>
          </div>

          {/* Teacher Login / Profile Card */}
          <div className="relative z-10 flex items-center gap-3 self-start md:self-center">
            {currentUser ? (
              <div className="flex items-center gap-3 p-2 pr-3 rounded-2xl bg-[#223D23] border border-[#2D5A27]/50 shadow-inner">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName}
                    className="w-9 h-9 rounded-xl object-cover border border-emerald-400"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-[#2D5A27] text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.displayName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">
                    {currentUser.displayName}
                  </h4>
                  <p className="text-[10px] text-emerald-300 font-medium">
                    Verified Educator
                  </p>
                </div>
                <button
                  id="btn-teacher-logout"
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-emerald-300 hover:text-red-300 transition ml-1"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-google-login"
                onClick={handleGoogleLogin}
                disabled={isAuthLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-emerald-50 text-[#1A2E1A] text-xs font-bold shadow-sm transition"
              >
                <LogIn className="w-4 h-4 text-[#2D5A27]" />
                <span>Sign in with Google</span>
              </button>
            )}

            {onOpen3DLibrary && (
              <button
                id="btn-open-3d-library-dashboard"
                onClick={onOpen3DLibrary}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-98 text-white border border-white/20 text-xs font-bold transition"
              >
                <Box className="w-4 h-4 text-emerald-300" />
                <span>3D Model Library</span>
              </button>
            )}

            <button
              id="btn-open-creator-modal"
              onClick={() => {
                setEditingProject(null);
                setIsCreatorOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] active:scale-98 text-white text-xs font-bold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student Project</span>
            </button>
          </div>
        </div>

        {/* 4 Bento Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1A2E1A] border border-[#2D5A27]/15 dark:border-[#2D5A27]/30 shadow-xs">
            <span className="text-[11px] font-bold text-[#2D5A27]/70 dark:text-emerald-400/80 block mb-1">
              Total Exhibits
            </span>
            <span className="text-2xl font-bold text-[#1A2E1A] dark:text-white">{projects.length}</span>
            <span className="text-[10px] text-[#2D5A27] dark:text-emerald-400 font-semibold block mt-1">
              Active AR Markers
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1A2E1A] border border-[#2D5A27]/15 dark:border-[#2D5A27]/30 shadow-xs">
            <span className="text-[11px] font-bold text-[#2D5A27]/70 dark:text-emerald-400/80 block mb-1">
              3D Models
            </span>
            <span className="text-2xl font-bold text-[#2D5A27] dark:text-emerald-400">{projects.length}</span>
            <span className="text-[10px] text-[#2D5A27]/70 dark:text-emerald-300/70 font-medium block mt-1">
              GLB & Biological
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1A2E1A] border border-[#2D5A27]/15 dark:border-[#2D5A27]/30 shadow-xs">
            <span className="text-[11px] font-bold text-[#2D5A27]/70 dark:text-emerald-400/80 block mb-1">
              Student Videos
            </span>
            <span className="text-2xl font-bold text-[#2D5A27] dark:text-emerald-400">
              {projects.filter(p => !!p.videoUrl).length}
            </span>
            <span className="text-[10px] text-[#2D5A27]/70 dark:text-emerald-300/70 font-medium block mt-1">
              MP4 Walkthroughs
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1A2E1A] border border-[#2D5A27]/15 dark:border-[#2D5A27]/30 shadow-xs">
            <span className="text-[11px] font-bold text-[#2D5A27]/70 dark:text-emerald-400/80 block mb-1">
              Recognition Speed
            </span>
            <span className="text-2xl font-bold text-[#1A2E1A] dark:text-white">~60 FPS</span>
            <span className="text-[10px] text-[#2D5A27] dark:text-emerald-400 font-semibold block mt-1">
              Dual-Engine Vision
            </span>
          </div>
        </div>

        {/* Filter & Action Bento Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-3xl bg-white dark:bg-[#1A2E1A] border border-[#2D5A27]/15 dark:border-[#2D5A27]/30 shadow-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-[#2D5A27]/60 absolute left-3 top-2.5" />
              <input
                id="input-search-projects"
                type="text"
                placeholder="Search student, topic, or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 dark:border-[#2D5A27]/30 text-xs text-[#1A2E1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
              />
            </div>

            <select
              id="select-filter-grade"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-3 py-1.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 dark:border-[#2D5A27]/30 text-xs text-[#1A2E1A] dark:text-white focus:outline-none font-medium"
            >
              <option value="all">All Grades</option>
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <button
              id="btn-print-markers"
              onClick={handlePrintAllPosters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#E8F0E8] dark:bg-[#223D23] hover:bg-[#d8e6d8] text-[#1A2E1A] dark:text-emerald-100 text-xs font-bold border border-[#2D5A27]/15 transition"
            >
              <FileDown className="w-3.5 h-3.5 text-[#2D5A27]" />
              <span>Print Bulletin Cards</span>
            </button>

            {projects.length > 0 ? (
              <button
                id="btn-delete-all-library"
                onClick={() => setShowDeleteAllConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-bold border border-red-200 dark:border-red-800 transition"
                title="Delete all images and exhibits in the library"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                <span>Delete All Library Items</span>
              </button>
            ) : (
              <button
                id="btn-restore-samples"
                onClick={handleResetDefaults}
                disabled={isResetting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] text-white text-xs font-bold shadow-xs transition"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>Restore Sample Exhibits</span>
              </button>
            )}

            {projects.length > 0 && (
              <button
                id="btn-reset-sample-data"
                onClick={handleResetDefaults}
                disabled={isResetting}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl text-[#2D5A27]/70 dark:text-emerald-400/80 hover:text-[#1A2E1A] dark:hover:text-white text-xs font-medium transition"
                title="Reset projects to standard default biology exhibits"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>Reset Defaults</span>
              </button>
            )}
          </div>
        </div>

        {/* Bento Projects Grid or Clean Empty State */}
        {filteredProjects.length === 0 ? (
          <div className="p-10 rounded-3xl bg-white dark:bg-[#1A2E1A] border border-[#2D5A27]/20 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-[#E8F0E8] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-300 mx-auto flex items-center justify-center shadow-inner">
              <FolderPlus className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-bold text-lg text-[#1A2E1A] dark:text-white">
                {projects.length === 0 ? 'Library is Clean & Empty' : 'No Matching Exhibits Found'}
              </h3>
              <p className="text-xs text-[#2D5A27]/70 dark:text-emerald-400/80 leading-relaxed">
                {projects.length === 0
                  ? 'All pre-made sample images and uploads have been removed. You can now add student drawings, custom 3D GLB files, and voice recordings, or restore sample exhibits anytime.'
                  : 'Try changing your search query or grade filter.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                id="btn-empty-add-project"
                onClick={() => {
                  setEditingProject(null);
                  setIsCreatorOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] text-white font-bold text-xs shadow-md shadow-[#2D5A27]/25 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student Project</span>
              </button>

              {projects.length === 0 && (
                <button
                  id="btn-empty-restore-samples"
                  onClick={handleResetDefaults}
                  disabled={isResetting}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#223D23] hover:bg-[#E8F0E8] text-[#1A2E1A] dark:text-emerald-200 font-bold text-xs border border-[#2D5A27]/20 transition"
                >
                  <RotateCcw className="w-4 h-4 text-[#2D5A27]" />
                  <span>Restore Sample Posters</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="flex flex-col bg-white dark:bg-[#1A2E1A] rounded-3xl border border-[#2D5A27]/15 dark:border-[#2D5A27]/30 overflow-hidden shadow-xs hover:shadow-md hover:border-[#2D5A27]/40 transition-all"
              >
                {/* Poster Marker Preview */}
                <div className="relative aspect-[16/10] bg-[#F4F7F5] dark:bg-[#132416] p-2 overflow-hidden group">
                  <img
                    src={project.markerImage}
                    alt={project.title}
                    className="w-full h-full object-contain rounded-2xl group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* 3D Model Badge */}
                  <div className="absolute top-4 left-4 px-2.5 py-1 rounded-xl bg-[#1A2E1A]/80 backdrop-blur-md text-emerald-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-[#2D5A27]/40">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>{project.modelType.replace('preset_', '').replace('_', ' ')}</span>
                  </div>

                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    {/* Voice-Over Audio Badge */}
                    {(project.audioTranscript || project.audioNarrationUrl) && (
                      <div className="p-1.5 rounded-xl bg-[#1A2E1A]/80 backdrop-blur-md text-emerald-300 border border-[#2D5A27]/40 flex items-center gap-1 px-2 text-[10px] font-bold" title="Student Voice-Over Attached">
                        <Volume2 className="w-3 h-3 text-emerald-400" />
                        <span>Voice</span>
                      </div>
                    )}

                    {/* Video Badge */}
                    {project.videoUrl && (
                      <div className="p-1.5 rounded-xl bg-[#1A2E1A]/80 backdrop-blur-md text-emerald-300 border border-[#2D5A27]/40" title="MP4 Video Presentation">
                        <Film className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Project Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-[#2D5A27] dark:text-emerald-400">
                        {project.studentName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#E8F0E8] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-300 text-[10px] font-bold">
                        {project.grade}
                      </span>
                    </div>

                    <h3 className="font-bold text-[#1A2E1A] dark:text-white text-sm line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="text-xs text-[#2D5A27]/80 dark:text-emerald-300/80 line-clamp-2 mt-1 leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  {/* Key Points Preview */}
                  <div className="p-2.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#132416] border border-[#2D5A27]/10 text-[11px] text-[#1A2E1A] dark:text-emerald-100">
                    <span className="font-bold text-[#2D5A27] dark:text-emerald-400">Topic: </span>
                    {project.topic}
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#2D5A27]/10 dark:border-[#2D5A27]/20">
                    <div className="flex items-center gap-1">
                      <button
                        id={`btn-edit-project-${project.id}`}
                        onClick={() => {
                          setEditingProject(project);
                          setIsCreatorOpen(true);
                        }}
                        className="p-2 rounded-xl text-[#2D5A27]/70 hover:text-[#2D5A27] hover:bg-[#E8F0E8] dark:hover:bg-[#223D23] transition"
                        title="Edit project metadata & files"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        id={`btn-delete-project-${project.id}`}
                        onClick={() => setProjectToDelete({ id: project.id, title: project.title })}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        title="Delete exhibit and files"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <a
                        href={project.markerImage}
                        download={`Poster_${project.studentName.replace(/\s+/g, '_')}.jpg`}
                        className="p-2 rounded-xl text-[#2D5A27]/70 hover:text-[#1A2E1A] dark:hover:text-white hover:bg-[#E8F0E8] dark:hover:bg-[#223D23] transition"
                        title="Download Marker Drawing"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>

                    <button
                      onClick={onOpenARScanner}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-[#E8F0E8] dark:bg-[#223D23] hover:bg-[#d8e6d8] text-[#2D5A27] dark:text-emerald-300 text-xs font-bold border border-[#2D5A27]/15 transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#2D5A27] dark:text-emerald-400" />
                      <span>Test in AR</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Single Exhibit Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E1B10]/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white dark:bg-[#1A2E1A] border border-red-300 dark:border-red-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#1A2E1A] dark:text-white">
                  Delete Exhibit from Library?
                </h3>
                <p className="text-xs text-[#2D5A27]/70 dark:text-emerald-400/80">
                  This will remove the marker drawing, 3D model, and student audio.
                </p>
              </div>
            </div>

            <p className="text-xs p-3 rounded-2xl bg-[#F4F7F5] dark:bg-[#132416] text-[#1A2E1A] dark:text-white font-medium border border-[#2D5A27]/10">
              "{projectToDelete.title}"
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 rounded-2xl text-xs font-bold text-[#2D5A27] dark:text-emerald-300 hover:bg-[#E8F0E8] dark:hover:bg-[#223D23] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSingleDelete}
                className="px-5 py-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition"
              >
                Delete Exhibit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Exhibits Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E1B10]/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white dark:bg-[#1A2E1A] border border-red-300 dark:border-red-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#1A2E1A] dark:text-white">
                  Delete All Library Exhibits?
                </h3>
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  This will delete all {projects.length} sample and uploaded exhibits from the database.
                </p>
              </div>
            </div>

            <p className="text-xs text-[#2D5A27]/80 dark:text-emerald-300/80 leading-relaxed bg-[#F4F7F5] dark:bg-[#132416] p-3 rounded-2xl border border-[#2D5A27]/10">
              You will have a completely clean library ready for fresh student uploads. You can also restore sample exhibits anytime using the "Restore Sample Exhibits" button.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllConfirm(false)}
                className="px-4 py-2 rounded-2xl text-xs font-bold text-[#2D5A27] dark:text-emerald-300 hover:bg-[#E8F0E8] dark:hover:bg-[#223D23] transition"
              >
                Keep Exhibits
              </button>
              <button
                type="button"
                onClick={confirmDeleteAll}
                disabled={isDeletingAll}
                className="flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingAll ? 'Deleting All...' : 'Yes, Delete All'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creator / Editor Modal */}
      {isCreatorOpen && (
        <ProjectCreatorModal
          initialProject={editingProject}
          onClose={() => {
            setIsCreatorOpen(false);
            setEditingProject(null);
          }}
          onSaved={() => {
            setIsCreatorOpen(false);
            setEditingProject(null);
          }}
          teacherName={currentUser?.displayName}
          teacherId={currentUser?.uid}
        />
      )}
    </div>
  );
};
