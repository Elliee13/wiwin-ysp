import React, { useState, useEffect } from 'react';
import { Menu, X, Plus, Edit2, Trash2, Save, LogOut, Users, Target, MapPin, Bot } from 'lucide-react';
import { useEffectEvent } from 'react';
import AdminMembershipSection from './AdminMembershipSection';
import { isSupabaseConfigured, supabase } from './lib/supabase';

const readStoredJson = (key, fallback) => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const savedValue = window.localStorage.getItem(key);
    return savedValue ? JSON.parse(savedValue) : fallback;
  } catch {
    return fallback;
  }
};

const writeStoredJson = (key, value) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeProgram = (program) => ({
  id: program.id,
  title: program.title,
  description: program.description,
  image: program.image_url,
});

const normalizeOpportunity = (opportunity) => ({
  id: opportunity.id,
  eventName: opportunity.event_name,
  date: opportunity.event_date,
  location: opportunity.location,
  description: opportunity.description,
});

const normalizeChapter = (chapter) => ({
  id: chapter.id,
  name: chapter.name,
  location: chapter.location,
  description: chapter.description,
});

const normalizeMemberApplication = (application) => ({
  id: application.id,
  name: application.name,
  email: application.email,
  status: application.status,
  submittedAt: application.submitted_at,
});

const normalizeChapterApplication = (application) => ({
  id: application.id,
  name: application.name,
  location: application.location,
  description: application.description,
  applicantName: application.applicant_name,
  applicantEmail: application.applicant_email,
  status: application.status,
  submittedAt: application.submitted_at,
});

const normalizeProfile = (profile) => ({
  id: profile.id,
  email: profile.email,
  fullName: profile.full_name ?? '',
  role: profile.role,
  chapterId: profile.chapter_id,
});

const YSPWebsite = () => {
  const useSupabase = Boolean(isSupabaseConfigured && supabase);
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoading, setIsLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [programs, setPrograms] = useState(() => readStoredJson('programs', []));

  useEffect(() => {
    if (!useSupabase) {
      writeStoredJson('programs', programs);
    }
  }, [programs, useSupabase]);

  const [chapters, setChapters] = useState(() => readStoredJson('chapters', []));

  useEffect(() => {
    if (!useSupabase) {
      writeStoredJson('chapters', chapters);
    }
  }, [chapters, useSupabase]);

  const [opportunities, setOpportunities] = useState(() => readStoredJson('opportunities', []));
  const [newProgram, setNewProgram] = useState({ title: '', description: '', image: null });
  const [programImagePreview, setProgramImagePreview] = useState(null);
  const [editingProgram, setEditingProgram] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showProgramDetail, setShowProgramDetail] = useState(false);
  const [newOpportunity, setNewOpportunity] = useState({ eventName: '', date: '', location: '', description: '' });
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [newChapter, setNewChapter] = useState({ name: '', location: '', description: '' });
  const [editingChapter, setEditingChapter] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: "Hello! I'm Bayani, your friendly assistant. How can I help you today?", sender: 'bot' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [memberApplications, setMemberApplications] = useState(() => readStoredJson('memberApplications', []));
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [chapterApplications, setChapterApplications] = useState(() => readStoredJson('chapterApplications', []));
  const [newChapterApplication, setNewChapterApplication] = useState({ name: '', location: '', description: '', applicantName: '', applicantEmail: '' });
  const [showChapterApplicationForm, setShowChapterApplicationForm] = useState(false);
  const [chapterApplicationSubmitted, setChapterApplicationSubmitted] = useState(false);
  const [dataError, setDataError] = useState('');
  const [assignedChapterId, setAssignedChapterId] = useState(null);
  const [chapterHeadProfiles, setChapterHeadProfiles] = useState([]);
  const [newChapterHead, setNewChapterHead] = useState({ id: '', email: '', fullName: '', chapterId: '' });

  useEffect(() => {
    if (!useSupabase) {
      writeStoredJson('opportunities', opportunities);
    }
  }, [opportunities, useSupabase]);

  useEffect(() => {
    if (!useSupabase) {
      writeStoredJson('memberApplications', memberApplications);
    }
  }, [memberApplications, useSupabase]);

  useEffect(() => {
    if (!useSupabase) {
      writeStoredJson('chapterApplications', chapterApplications);
    }
  }, [chapterApplications, useSupabase]);

  const loadUserProfile = useEffectEvent(async (userId) => {
    if (!useSupabase || !userId) {
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('role, chapter_id')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      setDataError(error.message);
      return;
    }

    if (!data) {
      setUserRole(null);
      setAssignedChapterId(null);
      setDataError('No profile found for this user. Create a profile row in Supabase first.');
      return;
    }

    setUserRole(data.role);
    setAssignedChapterId(data.chapter_id);
  });

  useEffect(() => {
    if (!useSupabase) {
      return undefined;
    }

    let cancelled = false;

    const run = async () => {
      setDataError('');

      const [programsResult, opportunitiesResult, chaptersResult] = await Promise.all([
        supabase.from('programs').select('*').order('created_at', { ascending: false }),
        supabase.from('opportunities').select('*').order('event_date', { ascending: true }),
        supabase.from('chapters').select('*').order('created_at', { ascending: false }),
      ]);

      if (cancelled) {
        return;
      }

      if (programsResult.error || opportunitiesResult.error || chaptersResult.error) {
        setDataError(
          programsResult.error?.message ||
            opportunitiesResult.error?.message ||
            chaptersResult.error?.message ||
            'Failed to load content from Supabase.',
        );
        return;
      }

      setPrograms(programsResult.data.map(normalizeProgram));
      setOpportunities(opportunitiesResult.data.map(normalizeOpportunity));
      setChapters(chaptersResult.data.map(normalizeChapter));
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [useSupabase]);

  useEffect(() => {
    if (!useSupabase) {
      return undefined;
    }

    const syncSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setDataError(error.message);
        return;
      }

      const hasSession = Boolean(data.session?.user);
      setIsLoggedIn(hasSession);

      if (hasSession) {
        await loadUserProfile(data.session.user.id);
      } else {
        setUserRole(null);
        setAssignedChapterId(null);
      }
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const hasSession = Boolean(session?.user);
      setIsLoggedIn(hasSession);

      if (hasSession) {
        void loadUserProfile(session.user.id);
      } else {
        setUserRole(null);
        setAssignedChapterId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [useSupabase]);

  useEffect(() => {
    if (!useSupabase || !isLoggedIn) {
      return undefined;
    }

    let cancelled = false;

    const run = async () => {
      const [memberApplicationsResult, chapterApplicationsResult, chapterHeadProfilesResult] = await Promise.all([
        supabase.from('member_applications').select('*').order('submitted_at', { ascending: false }),
        supabase.from('chapter_applications').select('*').order('submitted_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, email, full_name, role, chapter_id, created_at')
          .eq('role', 'chapter_head')
          .order('created_at', { ascending: false }),
      ]);

      if (cancelled) {
        return;
      }

      if (memberApplicationsResult.error || chapterApplicationsResult.error || chapterHeadProfilesResult.error) {
        setDataError(
          memberApplicationsResult.error?.message ||
            chapterApplicationsResult.error?.message ||
            chapterHeadProfilesResult.error?.message ||
            'Failed to load admin data from Supabase.',
        );
        return;
      }

      setMemberApplications(memberApplicationsResult.data.map(normalizeMemberApplication));
      setChapterApplications(chapterApplicationsResult.data.map(normalizeChapterApplication));
      setChapterHeadProfiles(chapterHeadProfilesResult.data.map(normalizeProfile));
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, useSupabase]);

  const handlePageChange = (page) => {
    setIsLoading(true);
    setTimeout(() => {
      setCurrentPage(page);
      setIsLoading(false);
    }, 500);
  };

  const addProgram = async () => {
    if (newProgram.title.trim()) {
      if (!useSupabase) {
        setPrograms([...programs, { id: createId(), ...newProgram }]);
        setNewProgram({ title: '', description: '', image: null });
        setProgramImagePreview(null);
        return;
      }

      const { data, error } = await supabase
        .from('programs')
        .insert({
          title: newProgram.title.trim(),
          description: newProgram.description.trim(),
          image_url: newProgram.image,
        })
        .select()
        .single();

      if (error) {
        setDataError(error.message);
        return;
      }

      setPrograms([normalizeProgram(data), ...programs]);
      setNewProgram({ title: '', description: '', image: null });
      setProgramImagePreview(null);
    }
  };

  const handleProgramImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProgramImagePreview(reader.result);
        setNewProgram({ ...newProgram, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProgram = (id, updated) => {
    setPrograms(programs.map(p => p.id === id ? { ...p, ...updated } : p));
  };

  const saveProgram = async (id) => {
    if (useSupabase) {
      const program = programs.find((item) => item.id === id);

      if (!program) {
        return;
      }

      const { error } = await supabase
        .from('programs')
        .update({
          title: program.title.trim(),
          description: program.description.trim(),
          image_url: program.image,
        })
        .eq('id', id);

      if (error) {
        setDataError(error.message);
        return;
      }
    }

    setEditingProgram(null);
  };

  const deleteProgram = async (id) => {
    if (useSupabase) {
      const { error } = await supabase.from('programs').delete().eq('id', id);

      if (error) {
        setDataError(error.message);
        return;
      }
    }

    setPrograms(programs.filter(p => p.id !== id));
  };

  const addOpportunity = async () => {
    if (newOpportunity.eventName.trim() && newOpportunity.date.trim()) {
      if (!useSupabase) {
        setOpportunities([...opportunities, { id: createId(), ...newOpportunity }]);
        setNewOpportunity({ eventName: '', date: '', location: '', description: '' });
        return;
      }

      const { data, error } = await supabase
        .from('opportunities')
        .insert({
          event_name: newOpportunity.eventName.trim(),
          event_date: newOpportunity.date,
          location: newOpportunity.location.trim(),
          description: newOpportunity.description.trim(),
        })
        .select()
        .single();

      if (error) {
        setDataError(error.message);
        return;
      }

      setOpportunities([...opportunities, normalizeOpportunity(data)]);
      setNewOpportunity({ eventName: '', date: '', location: '', description: '' });
    }
  };

  const updateOpportunity = (id, updated) => {
    setOpportunities(opportunities.map(o => o.id === id ? { ...o, ...updated } : o));
  };

  const saveOpportunity = async (id) => {
    if (useSupabase) {
      const opportunity = opportunities.find((item) => item.id === id);

      if (!opportunity) {
        return;
      }

      const { error } = await supabase
        .from('opportunities')
        .update({
          event_name: opportunity.eventName.trim(),
          event_date: opportunity.date,
          location: opportunity.location.trim(),
          description: opportunity.description.trim(),
        })
        .eq('id', id);

      if (error) {
        setDataError(error.message);
        return;
      }
    }

    setEditingOpportunity(null);
  };

  const deleteOpportunity = async (id) => {
    if (useSupabase) {
      const { error } = await supabase.from('opportunities').delete().eq('id', id);

      if (error) {
        setDataError(error.message);
        return;
      }
    }

    setOpportunities(opportunities.filter(o => o.id !== id));
  };

  const addChapter = async () => {
    if (newChapter.name.trim() && newChapter.location.trim()) {
      if (!useSupabase) {
        setChapters([...chapters, { id: createId(), ...newChapter }]);
        setNewChapter({ name: '', location: '', description: '' });
        return;
      }

      const { data, error } = await supabase
        .from('chapters')
        .insert({
          name: newChapter.name.trim(),
          location: newChapter.location.trim(),
          description: newChapter.description.trim(),
        })
        .select()
        .single();

      if (error) {
        setDataError(error.message);
        return;
      }

      setChapters([normalizeChapter(data), ...chapters]);
      setNewChapter({ name: '', location: '', description: '' });
    }
  };

  const updateChapter = (id, updated) => {
    setChapters(chapters.map(c => c.id === id ? { ...c, ...updated } : c));
  };

  const saveChapter = async (id) => {
    if (useSupabase) {
      const chapter = chapters.find((item) => item.id === id);

      if (!chapter) {
        return;
      }

      const { error } = await supabase
        .from('chapters')
        .update({
          name: chapter.name.trim(),
          location: chapter.location.trim(),
          description: chapter.description.trim(),
        })
        .eq('id', id);

      if (error) {
        setDataError(error.message);
        return;
      }
    }

    setEditingChapter(null);
  };

  const deleteChapter = async (id) => {
    if (useSupabase) {
      const { error } = await supabase.from('chapters').delete().eq('id', id);

      if (error) {
        setDataError(error.message);
        return;
      }
    }

    setChapters(chapters.filter(c => c.id !== id));
  };

  const saveAssignedChapter = async () => {
    const assignedChapter = chapters.find((chapter) => chapter.id === assignedChapterId);

    if (!assignedChapterId || !assignedChapter) {
      setDataError('This chapter head account is not assigned to a chapter yet.');
      return;
    }

    if (useSupabase) {
      const { error } = await supabase
        .from('chapters')
        .update({
          name: assignedChapter.name.trim(),
          location: assignedChapter.location.trim(),
          description: assignedChapter.description.trim(),
        })
        .eq('id', assignedChapterId);

      if (error) {
        setDataError(error.message);
        return;
      }
    }

  };

  const handleChapterApplication = async () => {
    if (newChapterApplication.name.trim() && newChapterApplication.location.trim() && newChapterApplication.applicantName.trim() && newChapterApplication.applicantEmail.trim()) {
      const newApplication = {
        ...newChapterApplication,
        status: 'pending',
        submittedAt: new Date().toISOString()
      };

      if (!useSupabase) {
        setChapterApplications([...chapterApplications, { id: createId(), ...newApplication }]);
      } else {
        const { error } = await supabase.from('chapter_applications').insert({
          name: newApplication.name.trim(),
          location: newApplication.location.trim(),
          description: newApplication.description.trim(),
          applicant_name: newApplication.applicantName.trim(),
          applicant_email: newApplication.applicantEmail.trim(),
          status: 'pending',
        });

        if (error) {
          setDataError(error.message);
          return;
        }
      }

      setChapterApplicationSubmitted(true);
      setNewChapterApplication({ name: '', location: '', description: '', applicantName: '', applicantEmail: '' });
    }
  };

  const approveChapterApplication = async (id) => {
    const application = chapterApplications.find(app => app.id === id);
    if (application) {
      if (useSupabase) {
        const { data: chapterData, error: chapterError } = await supabase
          .from('chapters')
          .insert({
            name: application.name,
            location: application.location,
            description: application.description,
          })
          .select()
          .single();

        if (chapterError) {
          setDataError(chapterError.message);
          return;
        }

        const { error: applicationError } = await supabase
          .from('chapter_applications')
          .update({ status: 'approved' })
          .eq('id', id);

        if (applicationError) {
          setDataError(applicationError.message);
          return;
        }

        setChapters([normalizeChapter(chapterData), ...chapters]);
      } else {
        const chapterId = createId();

        setChapters([...chapters, {
          id: chapterId,
          name: application.name,
          location: application.location,
          description: application.description
        }]);
      }

      setChapterApplications(chapterApplications.map(app =>
        app.id === id ? { ...app, status: 'approved' } : app
      ));
    }
  };

  const rejectChapterApplication = async (id) => {
    if (useSupabase) {
      const { error } = await supabase
        .from('chapter_applications')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) {
        setDataError(error.message);
        return;
      }
    }

    setChapterApplications(chapterApplications.map(app =>
      app.id === id ? { ...app, status: 'rejected' } : app
    ));
  };

  const handleLogin = async () => {
    setAuthLoading(true);

    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword.trim();

    if (useSupabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        setAuthLoading(false);
        return;
      }
    } else if (!(email === 'admin@ysp.ph' && password === 'admin123')) {
      alert('Invalid credentials. Please use:\nEmail: admin@ysp.ph\nPassword: admin123');
      setAuthLoading(false);
      return;
    }

    setIsLoggedIn(true);
    if (!useSupabase) {
      setUserRole('admin');
    }
    setCurrentPage('admin');
    setShowLogin(false);
    setLoginEmail('');
    setLoginPassword('');
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    setAuthLoading(true);

    if (useSupabase) {
      const { error } = await supabase.auth.signOut();

      if (error) {
        alert(error.message);
        setAuthLoading(false);
        return;
      }
    }

    setIsLoggedIn(false);
    setUserRole(null);
    setAssignedChapterId(null);
    setCurrentPage('home');
    setAuthLoading(false);
  };

  const handleMembershipApplication = async () => {
    if (applicantName.trim() && applicantEmail.trim()) {
      const newApplication = {
        name: applicantName,
        email: applicantEmail,
        status: 'pending',
        submittedAt: new Date().toISOString()
      };

      if (!useSupabase) {
        setMemberApplications([...memberApplications, { id: createId(), ...newApplication }]);
      } else {
        const { error } = await supabase.from('member_applications').insert({
          name: newApplication.name.trim(),
          email: newApplication.email.trim(),
          status: 'pending',
        });

        if (error) {
          setDataError(error.message);
          return;
        }
      }

      setApplicationSubmitted(true);
      setApplicantName('');
      setApplicantEmail('');
    }
  };

  const approveMemberApplication = async (id) => {
    if (useSupabase) {
      const { error } = await supabase
        .from('member_applications')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) {
        setDataError(error.message);
        return;
      }
    }

    setMemberApplications(memberApplications.map((application) =>
      application.id === id ? { ...application, status: 'approved' } : application
    ));
  };

  const rejectMemberApplication = async (id) => {
    if (useSupabase) {
      const { error } = await supabase
        .from('member_applications')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) {
        setDataError(error.message);
        return;
      }
    }

    setMemberApplications(memberApplications.map((application) =>
      application.id === id ? { ...application, status: 'rejected' } : application
    ));
  };

  const createChapterHeadProfile = async () => {
    if (!newChapterHead.id.trim() || !newChapterHead.email.trim() || !newChapterHead.chapterId) {
      setDataError('Auth user UUID, email, and assigned chapter are required for a chapter head.');
      return;
    }

    const payload = {
      id: newChapterHead.id.trim(),
      email: newChapterHead.email.trim().toLowerCase(),
      full_name: newChapterHead.fullName.trim() || null,
      role: 'chapter_head',
      chapter_id: newChapterHead.chapterId,
    };

    if (useSupabase) {
      const { data, error } = await supabase
        .from('profiles')
        .insert(payload)
        .select('id, email, full_name, role, chapter_id')
        .single();

      if (error) {
        setDataError(error.message);
        return;
      }

      setChapterHeadProfiles([normalizeProfile(data), ...chapterHeadProfiles]);
    } else {
      setChapterHeadProfiles([
        {
          id: payload.id,
          email: payload.email,
          fullName: payload.full_name ?? '',
          role: 'chapter_head',
          chapterId: payload.chapter_id,
        },
        ...chapterHeadProfiles,
      ]);
    }

    setNewChapterHead({ id: '', email: '', fullName: '', chapterId: '' });
  };

  const updateChapterHeadProfile = (id, updated) => {
    setChapterHeadProfiles(chapterHeadProfiles.map((profile) =>
      profile.id === id ? { ...profile, ...updated } : profile
    ));
  };

  const saveChapterHeadProfile = async (id) => {
    const profile = chapterHeadProfiles.find((item) => item.id === id);

    if (!profile) {
      return;
    }

    if (useSupabase) {
      const { error } = await supabase
        .from('profiles')
        .update({
          email: profile.email.trim().toLowerCase(),
          full_name: profile.fullName.trim() || null,
          chapter_id: profile.chapterId || null,
        })
        .eq('id', id);

      if (error) {
        setDataError(error.message);
      }
    }
  };

  const deleteChapterHeadProfile = async (id) => {
    if (useSupabase) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);

      if (error) {
        setDataError(error.message);
        return;
      }
    }

    setChapterHeadProfiles(chapterHeadProfiles.filter((profile) => profile.id !== id));
  };

  const getBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Custom prompt responses
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return 'Hello! Welcome to Youth Service Philippines. How can I assist you today?';
    }
    if (message.includes('program') || message.includes('programs')) {
      return 'We offer various programs including community service, leadership training, and youth development. Check out our Programs page for more details!';
    }
    if (message.includes('volunteer') || message.includes('opportunity')) {
      return 'We have many volunteer opportunities available! Visit our Opportunities page to see upcoming events and how you can help.';
    }
    if (message.includes('member') || message.includes('join')) {
      return 'We\'d love to have you join us! Go to the Membership page to start your application process.';
    }
    if (message.includes('chapter') || message.includes('local')) {
      return 'You can start a local chapter in your area! Click on "Create a Chapter" on our home page to apply.';
    }
    if (message.includes('contact') || message.includes('email') || message.includes('phone')) {
      return 'You can reach us at phyouthservice@gmail.com or call us at 09177798413. You can also find us on Facebook as iVolunteer Philippines.';
    }
    if (message.includes('thank')) {
      return 'You\'re welcome! Is there anything else I can help you with?';
    }
    if (message.includes('bye') || message.includes('goodbye')) {
      return 'Goodbye! Thank you for your interest in Youth Service Philippines. Have a great day!';
    }
    if (message.includes('about') || message.includes('details') || message.includes('information')) {
      return 'iVolunteer is the Philippines\' largest volunteer portal built BY VOLUNTEERS  FOR VOLUNTEERS';
    }   
    
    // Default response
    return 'I\'m here to help! You can ask me about our programs, volunteer opportunities, membership, chapters, or contact information. What would you like to know?';
  };

  const handleSendMessage = () => {
    if (userInput.trim()) {
      const trimmedMessage = userInput.trim();
      const newUserMessage = {
        id: createId(),
        text: trimmedMessage,
        sender: 'user'
      };
      
      setChatMessages([...chatMessages, newUserMessage]);
      setUserInput('');
      
      // Add bot response after a short delay
      setTimeout(() => {
        const botResponse = {
          id: createId(),
          text: getBotResponse(trimmedMessage),
          sender: 'bot'
        };
        setChatMessages(prev => [...prev, botResponse]);
      }, 1000);
    }
  };

  const assignedChapter = chapters.find((chapter) => chapter.id === assignedChapterId) ?? null;

  return (
    <div className="min-h-screen bg-slate-50">
      {dataError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 text-sm text-red-700">
          {dataError}
        </div>
      )}
      {!useSupabase && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-sm text-amber-800">
          Supabase environment variables are not configured yet. The app is currently running in local demo mode.
        </div>
      )}
      {currentPage !== 'admin' && (
      <>
        <header className="bg-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src="/YSP LOGO.png" alt="YSP Logo" className="h-20 w-20" />
              <h1 className="text-3xl font-bold text-amber-700">Youth Service Philippines</h1>
            </div>
            <button onClick={() => setShowSidebar(!showSidebar)} className="p-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 animate-pulse">
              {showSidebar ? <X size={32} /> : <Menu size={32} />}
            </button>
          </div>
        </header>
        
        {/* Sidebar */}
        <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${showSidebar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowSidebar(false)}></div>
          <div className={`absolute left-0 top-0 h-full w-64 bg-white shadow-lg transition-transform duration-300 ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-8">
                  <img src="/YSP LOGO.png" alt="YSP Logo" className="h-16 w-16" />
                  <h2 className="text-xl font-bold text-amber-700">YSP</h2>
                </div>
                <nav className="space-y-4">
                  <button onClick={() => {handlePageChange('home'); setShowSidebar(false);}} className={`w-full text-left px-4 py-3 rounded-lg transition ${currentPage === 'home' ? 'bg-amber-100 text-amber-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}>Home</button>
                  <button onClick={() => {handlePageChange('programs'); setShowSidebar(false);}} className={`w-full text-left px-4 py-3 rounded-lg transition ${currentPage === 'programs' ? 'bg-amber-100 text-amber-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}>Programs</button>
                  <button onClick={() => {handlePageChange('membership'); setShowSidebar(false);}} className={`w-full text-left px-4 py-3 rounded-lg transition ${currentPage === 'membership' ? 'bg-amber-100 text-amber-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}>Membership</button>
                  <button onClick={() => {handlePageChange('opportunities'); setShowSidebar(false);}} className={`w-full text-left px-4 py-3 rounded-lg transition ${currentPage === 'opportunities' ? 'bg-amber-100 text-amber-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}>Opportunities</button>
                  {isLoggedIn && (
                    <>
                      <button onClick={() => {setCurrentPage('admin'); setShowSidebar(false);}} className="w-full text-left px-4 py-3 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 transition">Dashboard</button>
                      <button onClick={() => {handleLogout(); setShowSidebar(false);}} className="w-full text-left px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition">Logout</button>
                    </>
                  )}
                  {!isLoggedIn && (
                    <button onClick={() => {setShowLogin(true); setShowSidebar(false);}} className="w-full text-left px-4 py-3 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 transition">Dashboard Login</button>
                  )}
                </nav>
              </div>
            </div>
          </div>
      </>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-700 font-semibold">Loading. Please wait...</p>
          </div>
        </div>
      )}

      {showLogin && (
        <div className="fixed inset-0 bg-gradient-to-br from-amber-100 to-white flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Sign In</h3>
            <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Email" />
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Password" />
            <button onClick={handleLogin} disabled={authLoading} className="w-full bg-amber-600 text-white py-3 rounded-lg mb-4 hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {authLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Signing you in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
            <p className="text-sm text-gray-500">
              {useSupabase
                ? 'Use a Supabase Auth account with access to your project.'
                : 'Demo: admin@ysp.ph / admin123'}
            </p>
          </div>
        </div>
      )}

      {currentPage === 'home' && (
        <div>
          {/* Hero Section */}
          <section className="bg-gradient-to-r from-amber-600 to-amber-700 text-white py-12 md:py-20">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Empowering Youth to Serve Communities</h2>
              <p className="text-base md:text-xl mb-6 md:mb-8">Join us in making a difference across the Philippines</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button onClick={() => handlePageChange('membership')} className="bg-white text-amber-700 px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition shadow-lg">Get Involved</button>
                <button onClick={() => handlePageChange('programs')} className="bg-transparent border-2 border-white text-white px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-amber-700 transition shadow-lg">Learn More</button>
              </div>
            </div>
          </section>
          
          {/* About Section */}
          <section className="py-8 md:py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-8 md:mb-12">
                <h3 className="text-2xl md:text-4xl font-bold text-gray-800 mb-4">Who We Are</h3>
                <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">Youth Service Philippines is a non-profit organization dedicated to empowering young people to serve their communities through volunteerism, leadership development, and community engagement.</p>
              </div>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                <div className="text-center p-4 md:p-6">
                  <div className="bg-amber-100 rounded-full w-14 h-14 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-4">
                    <Users className="text-amber-700" size={28} />
                  </div>
                  <h4 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">Community Service</h4>
                  <p className="text-sm md:text-base text-gray-600">Engaging youth in meaningful service projects that benefit local communities.</p>
                </div>
                <div className="text-center p-4 md:p-6">
                  <div className="bg-amber-100 rounded-full w-14 h-14 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-4">
                    <Target className="text-amber-700" size={28} />
                  </div>
                  <h4 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">Leadership Development</h4>
                  <p className="text-sm md:text-base text-gray-600">Building tomorrow's leaders through training and mentorship programs.</p>
                </div>
                <div className="text-center p-4 md:p-6 sm:col-span-2 md:col-span-1">
                  <div className="bg-amber-100 rounded-full w-14 h-14 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="text-amber-700" size={28} />
                  </div>
                  <h4 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">Nationwide Impact</h4>
                  <p className="text-sm md:text-base text-gray-600">Creating positive change across the Philippines through local chapters.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Programs Section */}
          <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-12">
                <h3 className="text-4xl font-bold text-gray-800 mb-4">Our Programs</h3>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">Discover our diverse range of programs designed to empower youth and serve communities.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {programs.length > 0 ? (
                  programs.map((prog) => {
                    return (
                    <div 
                      key={prog.id} 
                      className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-transparent hover:border-amber-500 transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedProgram(prog);
                        setShowProgramDetail(true);
                      }}
                    >
                      {prog.image && (
                        <img 
                          src={prog.image} 
                          alt={prog.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-6">
                        <h4 className="text-xl font-semibold text-amber-700 mb-2">{prog.title}</h4>
                        <p className="text-gray-600 mb-4">{prog.description}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProgram(prog);
                            setShowProgramDetail(true);
                          }}
                          className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-semibold"
                        >
                          Learn More
                        </button>
                      </div>
                    </div>
                    );
                  })
                ) : (
                  <div className="col-span-3 text-center text-gray-500">No programs yet. Check back soon!</div>
                )}
              </div>
            </div>
          </section>

          {/* Chapter Section */}
          <section className="py-8 md:py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4">
              <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg shadow-lg p-6 md:p-12 text-center">
                <h3 className="text-2xl md:text-4xl font-bold mb-4">Want to Start a Chapter?</h3>
                <p className="text-base md:text-xl mb-6 max-w-2xl mx-auto">Join us in creating a local chapter of Youth Service Philippines in your area and make a difference in your community.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  {isLoggedIn && userRole === 'admin' ? (
                    <button onClick={() => window.open('https://forms.gle/cWPsgBJKLaQoLuUr8?fbclid=IwY2xjawOKRLJleHRuA2FlbQIxMABicmlkETFJWDhJY0U1azBWMDFLOXh2c3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHm01_q8ZFNsR30YIkD2ODzju7eleolSNiJgUoZKW11PV7HAc0NeXszwCRjFU_aem_2mVtlAdu6_smAMkowigvAA')} className="bg-white text-amber-700 px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition shadow-lg">Create a Chapter</button>
                  ) : (
                    <button onClick={() => setShowChapterApplicationForm(true)} className="bg-white text-amber-700 px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition shadow-lg">Apply to Start a Chapter</button>
                  )}
                  <button onClick={() => setCurrentPage('membership')} className="bg-transparent border-2 border-white text-white px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-amber-700 transition shadow-lg">Join as Member</button>
                </div>
                <p className="text-xs md:text-sm text-amber-100 mt-4 md:mt-6">
                  {isLoggedIn && userRole === 'admin' 
                    ? 'As an admin, you can create new chapters for the organization.' 
                    : 'Chapter creation is restricted to administrators only. Please contact our team for assistance.'}
                </p>
              </div>
            </div>
          </section>

          {/* Existing Chapters Section */}
          {chapters.length > 0 && (
            <section className="py-16 bg-gray-50">
              <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-12">
                  <h3 className="text-4xl font-bold text-gray-800 mb-4">Our Chapters</h3>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">Join a local chapter near you and start making a difference in your community.</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {chapters.map((chapter) => (
                    <div key={chapter.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border border-green-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-green-100 rounded-full p-3">
                          <MapPin className="text-green-600" size={24} />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-800">{chapter.name}</h4>
                          <p className="text-sm text-green-600 font-medium">{chapter.location}</p>
                        </div>
                      </div>
                      <p className="text-gray-600 leading-relaxed mb-4">{chapter.description}</p>
                      <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-semibold">
                        Join Chapter
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {currentPage === 'programs' && (
        <div className="py-8 md:py-16 bg-gradient-to-br from-gray-50 to-amber-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-6 md:mb-8 text-center">Our Programs</h2>
            <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.length > 0 ? (
                programs.map(p => (
                  <div key={p.id} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-100">
                    {p.image && (
                      <img 
                        src={p.image} 
                        alt={p.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-600"></div>
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-amber-100 rounded-full p-2">
                          <Target className="text-amber-600" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">{p.title}</h3>
                      </div>
                      <p className="text-gray-600 leading-relaxed">{p.description}</p>
                      <button 
                        onClick={() => {
                          setSelectedProgram(p);
                          setShowProgramDetail(true);
                        }}
                        className="mt-4 w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-2 px-4 rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all font-semibold"
                      >
                        Learn More
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Target className="text-gray-300 mx-auto mb-4" size={64} />
                  <p className="text-gray-500 text-lg">No programs yet. Check back soon!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentPage === 'membership' && (
        <div className="py-8 md:py-16 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-6 md:mb-8 text-center">Join Us</h2>
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-100">
              <h3 className="text-xl md:text-2xl font-bold text-amber-700 mb-4 text-center">Become a Member</h3>
              <p className="text-sm md:text-base text-gray-700 mb-6 text-center">Join our community of passionate youth volunteers. Please provide your details below to start your application.</p>

              {!applicationSubmitted ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                      placeholder="Enter your email address"
                    />
                  </div>
                  <button 
                    onClick={handleMembershipApplication}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
                  >
                    Submit Application
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 mb-2">Application Submitted!</h4>
                  <p className="text-gray-600 mb-4">Thank you for your interest! Your application is being reviewed by our team. Once approved, you will receive an email with the link to complete your registration.</p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> Please check your email regularly for updates on your application status.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentPage === 'opportunities' && (
        <div className="py-8 md:py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-6 md:mb-8 text-center">Volunteer Opportunities</h2>
            <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {opportunities.length > 0 ? opportunities.map(o => (
                <div key={o.id} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-100">
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-100 rounded-full p-2">
                        <MapPin className="text-blue-600" size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">{o.eventName}</h3>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="bg-gray-100 rounded-full p-1">
                          <Target className="text-gray-500" size={16} />
                        </div>
                        <span className="text-sm">{o.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="bg-gray-100 rounded-full p-1">
                          <MapPin className="text-gray-500" size={16} />
                        </div>
                        <span className="text-sm">{o.location}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed mb-4">{o.description}</p>
                    <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all font-semibold">
                      Apply Now
                    </button>
                  </div>
                </div>
              )) : (
                <div className="col-span-full text-center py-12">
                  <MapPin className="text-gray-300 mx-auto mb-4" size={64} />
                  <p className="text-gray-500 text-lg">No opportunities yet. Check back soon!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}



      {currentPage === 'admin' && isLoggedIn && userRole === 'admin' && (
        <div className="py-8 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            {/* Dashboard Header */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl shadow-2xl p-6 md:p-8 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">Admin Dashboard</h2>
                  <p className="text-amber-100 text-sm md:text-base">Manage programs, opportunities, and content</p>
                </div>
                <button onClick={handleLogout} disabled={authLoading} className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                  {authLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-600 border-t-transparent"></div>
                      <span>Logging out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut size={20} /> Logout
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-500 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Total Programs</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-800">{programs.length}</p>
                  </div>
                  <div className="bg-amber-100 rounded-full p-3">
                    <Target className="text-amber-600" size={24} />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Opportunities</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-800">{opportunities.length}</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <Users className="text-blue-600" size={24} />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Active Events</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-800">{opportunities.filter(o => new Date(o.date) >= new Date()).length}</p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <MapPin className="text-green-600" size={24} />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Admin Status</p>
                    <p className="text-lg md:text-xl font-bold text-green-600">Active</p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <Bot className="text-purple-600" size={24} />
                  </div>
                </div>
              </div>
            </div>
            
            <AdminMembershipSection 
              memberApplications={memberApplications} 
              onApproveMemberApplication={approveMemberApplication}
              onRejectMemberApplication={rejectMemberApplication}
            />

            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-100 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-100 rounded-lg p-2">
                  <Users className="text-indigo-600" size={24} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-800">Chapter Head User Management</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Create chapter head access for existing Supabase Auth users by pasting their Auth user UUID, then assign them to a chapter.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Auth User UUID"
                  value={newChapterHead.id}
                  onChange={(e) => setNewChapterHead({ ...newChapterHead, id: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newChapterHead.email}
                  onChange={(e) => setNewChapterHead({ ...newChapterHead, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <input
                  type="text"
                  placeholder="Full name"
                  value={newChapterHead.fullName}
                  onChange={(e) => setNewChapterHead({ ...newChapterHead, fullName: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <select
                  value={newChapterHead.chapterId}
                  onChange={(e) => setNewChapterHead({ ...newChapterHead, chapterId: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                >
                  <option value="">Assign chapter</option>
                  {chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={createChapterHeadProfile}
                className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-600 hover:to-blue-700 transition-all shadow-md mb-6"
              >
                Add Chapter Head
              </button>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-3 text-left">Full Name</th>
                      <th className="border p-3 text-left">Email</th>
                      <th className="border p-3 text-left">Auth User UUID</th>
                      <th className="border p-3 text-left">Assigned Chapter</th>
                      <th className="border p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chapterHeadProfiles.length > 0 ? (
                      chapterHeadProfiles.map((profile) => (
                        <tr key={profile.id}>
                          <td className="border p-3">
                            <input
                              type="text"
                              value={profile.fullName}
                              onChange={(e) => updateChapterHeadProfile(profile.id, { fullName: e.target.value })}
                              className="w-full p-2 border rounded"
                            />
                          </td>
                          <td className="border p-3">
                            <input
                              type="email"
                              value={profile.email}
                              onChange={(e) => updateChapterHeadProfile(profile.id, { email: e.target.value })}
                              className="w-full p-2 border rounded"
                            />
                          </td>
                          <td className="border p-3 text-xs text-gray-600 break-all">{profile.id}</td>
                          <td className="border p-3">
                            <select
                              value={profile.chapterId ?? ''}
                              onChange={(e) => updateChapterHeadProfile(profile.id, { chapterId: e.target.value })}
                              className="w-full p-2 border rounded"
                            >
                              <option value="">Unassigned</option>
                              {chapters.map((chapter) => (
                                <option key={chapter.id} value={chapter.id}>
                                  {chapter.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="border p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveChapterHeadProfile(profile.id)}
                                className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                              >
                                <Save size={16} /> Save
                              </button>
                              <button
                                onClick={() => deleteChapterHeadProfile(profile.id)}
                                className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                              >
                                <Trash2 size={16} /> Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="border p-3 text-center text-gray-500">
                          No chapter head profiles yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-amber-100 rounded-lg p-2">
                    <Plus className="text-amber-600" size={24} />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800">Add New Program</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Program Title</label>
                    <input
                      type="text"
                      placeholder="Enter program title"
                      value={newProgram.title}
                      onChange={(e) => setNewProgram({ ...newProgram, title: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      placeholder="Enter program description"
                      value={newProgram.description}
                      onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition h-24 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Program Image</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-amber-500 transition-colors">
                      <div className="space-y-1 text-center">
                        {programImagePreview ? (
                          <div className="relative">
                            <img 
                              src={programImagePreview} 
                              alt="Program preview" 
                              className="max-h-40 mx-auto rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setProgramImagePreview(null);
                                setNewProgram({ ...newProgram, image: null });
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 48 48"
                              aria-hidden="true"
                            >
                              <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <div className="flex text-sm text-gray-600">
                              <label htmlFor="program-image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-amber-600 hover:text-amber-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-amber-500">
                                <span>Upload a file</span>
                                <input
                                  id="program-image-upload"
                                  name="program-image-upload"
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  onChange={handleProgramImageUpload}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={addProgram} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-amber-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg">
                    <Plus size={20} /> Add Program
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-100 rounded-lg p-2">
                    <Target className="text-blue-600" size={24} />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800">Manage Programs</h3>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {programs.length > 0 ? (
                    programs.map(prog => (
                      <div key={prog.id} className="border border-gray-200 rounded-lg p-4 hover:border-amber-300 transition-colors">
                        {editingProgram === prog.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              defaultValue={prog.title}
                              onChange={(e) => updateProgram(prog.id, { title: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                            <textarea
                              defaultValue={prog.description}
                              onChange={(e) => updateProgram(prog.id, { description: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 h-16 resize-none"
                            />
                            <button onClick={() => saveProgram(prog.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition">
                              <Save size={16} /> Save Changes
                            </button>
                          </div>
                        ) : (
                          <>
                            {prog.image && (
                              <img 
                                src={prog.image} 
                                alt={prog.title}
                                className="w-full h-32 object-cover rounded-lg mb-3"
                              />
                            )}
                            <h4 className="font-bold text-lg text-gray-800 mb-2">{prog.title}</h4>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{prog.description}</p>
                            <div className="flex gap-2">
                              <button onClick={() => setEditingProgram(prog.id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-blue-700 transition">
                                <Edit2 size={16} /> Edit
                              </button>
                              <button onClick={() => deleteProgram(prog.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-red-700 transition">
                                <Trash2 size={16} /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Target className="text-gray-300 mx-auto mb-3" size={48} />
                      <p className="text-gray-500">No programs yet. Add one to get started.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 rounded-lg p-2">
                <MapPin className="text-green-600" size={24} />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Volunteer Opportunities</h2>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Event Name"
                  value={newOpportunity.eventName}
                  onChange={(e) => setNewOpportunity({ ...newOpportunity, eventName: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                />
                <input
                  type="date"
                  value={newOpportunity.date}
                  onChange={(e) => setNewOpportunity({ ...newOpportunity, date: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={newOpportunity.location}
                  onChange={(e) => setNewOpportunity({ ...newOpportunity, location: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                />
                <button onClick={addOpportunity} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-amber-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg">
                  <Plus size={20} /> Add Opportunity
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  placeholder="Enter event description"
                  value={newOpportunity.description}
                  onChange={(e) => setNewOpportunity({ ...newOpportunity, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition h-24 resize-none"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-3 text-left">Event Name</th>
                      <th className="border p-3 text-left">Date</th>
                      <th className="border p-3 text-left">Location</th>
                      <th className="border p-3 text-left">Description</th>
                      <th className="border p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opportunities.length > 0 ? (
                      opportunities.map(opp => (
                        <tr key={opp.id}>
                          <td className="border p-3">
                            {editingOpportunity === opp.id ? (
                              <input
                                type="text"
                                defaultValue={opp.eventName}
                                onChange={(e) => updateOpportunity(opp.id, { eventName: e.target.value })}
                                className="w-full p-2 border rounded"
                              />
                            ) : (
                              opp.eventName
                            )}
                          </td>
                          <td className="border p-3">
                            {editingOpportunity === opp.id ? (
                              <input
                                type="date"
                                defaultValue={opp.date}
                                onChange={(e) => updateOpportunity(opp.id, { date: e.target.value })}
                                className="w-full p-2 border rounded"
                              />
                            ) : (
                              opp.date
                            )}
                          </td>
                          <td className="border p-3">
                            {editingOpportunity === opp.id ? (
                              <input
                                type="text"
                                defaultValue={opp.location}
                                onChange={(e) => updateOpportunity(opp.id, { location: e.target.value })}
                                className="w-full p-2 border rounded"
                              />
                            ) : (
                              opp.location
                            )}
                          </td>
                          <td className="border p-3">
                            {editingOpportunity === opp.id ? (
                              <textarea
                                defaultValue={opp.description}
                                onChange={(e) => updateOpportunity(opp.id, { description: e.target.value })}
                                className="w-full p-2 border rounded h-16"
                              />
                            ) : (
                              opp.description
                            )}
                          </td>
                          <td className="border p-3">
                            {editingOpportunity === opp.id ? (
                              <button onClick={() => saveOpportunity(opp.id)} className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm">
                                <Save size={16} /> Save
                              </button>
                            ) : (
                              <div className="flex gap-2">
                                <button onClick={() => setEditingOpportunity(opp.id)} className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm">
                                  <Edit2 size={16} /> Edit
                                </button>
                                <button onClick={() => deleteOpportunity(opp.id)} className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm">
                                  <Trash2 size={16} /> Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="border p-3 text-center text-gray-500">No opportunities yet. Add one to get started.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chapter Management Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-lg p-2">
                    <MapPin className="text-green-600" size={24} />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800">Manage Chapters</h3>
                </div>
                <button
                  onClick={() => window.open('https://forms.gle/cWPsgBJKLaQoLuUr8?fbclid=IwY2xjawOKRLJleHRuA2FlbQIxMABicmlkETFJWDhJY0U1azBWMDFLOXh2c3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHm01_q8ZFNsR30YIkD2ODzju7eleolSNiJgUoZKW11PV7HAc0NeXszwCRjFU_aem_2mVtlAdu6_smAMkowigvAA')}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <Plus size={20} /> Create Chapter via Google Form
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Chapter Name"
                  value={newChapter.name}
                  onChange={(e) => setNewChapter({ ...newChapter, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={newChapter.location}
                  onChange={(e) => setNewChapter({ ...newChapter, location: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                />
                <button onClick={addChapter} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg">
                  <Plus size={20} /> Add Chapter
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  placeholder="Enter chapter description"
                  value={newChapter.description}
                  onChange={(e) => setNewChapter({ ...newChapter, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition h-24 resize-none"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-3 text-left">Chapter Name</th>
                      <th className="border p-3 text-left">Location</th>
                      <th className="border p-3 text-left">Description</th>
                      <th className="border p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chapters.length > 0 ? (
                      chapters.map(chapter => (
                        <tr key={chapter.id}>
                          <td className="border p-3">
                            {editingChapter === chapter.id ? (
                              <input
                                type="text"
                                defaultValue={chapter.name}
                                onChange={(e) => updateChapter(chapter.id, { name: e.target.value })}
                                className="w-full p-2 border rounded"
                              />
                            ) : (
                              chapter.name
                            )}
                          </td>
                          <td className="border p-3">
                            {editingChapter === chapter.id ? (
                              <input
                                type="text"
                                defaultValue={chapter.location}
                                onChange={(e) => updateChapter(chapter.id, { location: e.target.value })}
                                className="w-full p-2 border rounded"
                              />
                            ) : (
                              chapter.location
                            )}
                          </td>
                          <td className="border p-3">
                            {editingChapter === chapter.id ? (
                              <textarea
                                defaultValue={chapter.description}
                                onChange={(e) => updateChapter(chapter.id, { description: e.target.value })}
                                className="w-full p-2 border rounded h-16"
                              />
                            ) : (
                              chapter.description
                            )}
                          </td>
                          <td className="border p-3">
                            {editingChapter === chapter.id ? (
                              <button onClick={() => saveChapter(chapter.id)} className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm">
                                <Save size={16} /> Save
                              </button>
                            ) : (
                              <div className="flex gap-2">
                                <button onClick={() => setEditingChapter(chapter.id)} className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm">
                                  <Edit2 size={16} /> Edit
                                </button>
                                <button onClick={() => deleteChapter(chapter.id)} className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm">
                                  <Trash2 size={16} /> Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="border p-3 text-center text-gray-500">No chapters yet. Add one to get started.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chapter Applications Management Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-100 rounded-lg p-2">
                  <Users className="text-purple-600" size={24} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-800">Chapter Applications</h3>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {chapterApplications.length > 0 ? (
                  chapterApplications.map(app => (
                    <div key={app.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-lg text-gray-800">{app.name}</h4>
                          <p className="text-sm text-gray-600">Location: {app.location}</p>
                          <p className="text-sm text-gray-600">Applicant: {app.applicantName} ({app.applicantEmail})</p>
                          <p className="text-xs text-gray-500 mt-1">Submitted: {new Date(app.submittedAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          app.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : app.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{app.description}</p>
                      {app.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveChapterApplication(app.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-green-700 transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve
                          </button>
                          <button
                            onClick={() => rejectChapterApplication(app.id)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-red-700 transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="text-gray-300 mx-auto mb-3" size={48} />
                    <p className="text-gray-500">No chapter applications yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {currentPage === 'admin' && isLoggedIn && userRole === 'chapter_head' && (
        <div className="py-8 md:py-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-2xl p-6 md:p-8 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">Chapter Head Dashboard</h2>
                  <p className="text-green-100 text-sm md:text-base">Manage your assigned chapter details.</p>
                </div>
                <button onClick={handleLogout} disabled={authLoading} className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                  {authLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-600 border-t-transparent"></div>
                      <span>Logging out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut size={20} /> Logout
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-100">
              {assignedChapter ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chapter Name</label>
                    <input
                      type="text"
                      value={assignedChapter.name}
                      onChange={(e) => updateChapter(assignedChapter.id, { name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={assignedChapter.location}
                      onChange={(e) => updateChapter(assignedChapter.id, { location: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={assignedChapter.description}
                      onChange={(e) => updateChapter(assignedChapter.id, { description: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 h-28 resize-none"
                    />
                  </div>
                  <button
                    onClick={saveAssignedChapter}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:from-green-600 hover:to-emerald-700 transition-all shadow-md"
                  >
                    <Save size={18} /> Save Chapter
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <MapPin className="text-gray-300 mx-auto mb-3" size={48} />
                  <p className="text-gray-600">This account is not assigned to a chapter yet.</p>
                  <p className="text-sm text-gray-500 mt-2">Ask an admin to assign a chapter in the `profiles` table.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentPage === 'admin' && isLoggedIn && !userRole && (
        <div className="py-8 md:py-16">
          <div className="max-w-3xl mx-auto px-4">
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-100 text-center">
              <Users className="text-gray-300 mx-auto mb-4" size={48} />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Setup Needed</h2>
              <p className="text-gray-600">This signed-in user does not have a matching role in the `profiles` table yet.</p>
            </div>
          </div>
        </div>
      )}

      {/* Chatbot Floating Button */}
      {currentPage !== 'admin' && (
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-8 right-8 bg-orange-600 text-white p-4 rounded-full shadow-lg hover:bg-orange-700 transition z-50"
      >
        {showChat ? <X size={24} /> : <Bot size={24} />}
      </button>
      )}

      {/* Chatbot Window */}
      {showChat && currentPage !== 'admin' && (
        <div className="fixed bottom-24 right-8 w-96 bg-white rounded-lg shadow-2xl z-50 flex flex-col" style={{maxHeight: '500px'}}>
          <div className="bg-orange-600 text-white p-4 rounded-t-lg">
            <h3 className="font-bold text-lg">Bayani</h3>
            <p className="text-sm text-orange-100">Your friendly assistant</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{maxHeight: '350px'}}>
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.sender === 'user'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:border-orange-600"
              />
              <button
                onClick={handleSendMessage}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Youth Service Philippines</h3>
              <p className="text-gray-400 text-sm">Empowering youth to serve communities across the Philippines through volunteerism and leadership.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <p className="text-gray-400 text-sm mb-2"><strong>Email:</strong> phyouthservice@gmail.com</p>
              <p className="text-gray-400 text-sm mb-2"><strong>Phone:</strong> 09177798413</p>
              <p className="text-gray-400 text-sm"><strong>Facebook:</strong> iVolunteer Philippines</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><button onClick={() => handlePageChange('home')} className="text-gray-400 text-sm hover:text-white transition">Home</button></li>
                <li><button onClick={() => handlePageChange('programs')} className="text-gray-400 text-sm hover:text-white transition">Programs</button></li>
                <li><button onClick={() => handlePageChange('membership')} className="text-gray-400 text-sm hover:text-white transition">Membership</button></li>
                <li><button onClick={() => handlePageChange('opportunities')} className="text-gray-400 text-sm hover:text-white transition">Opportunities</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
              <a
                href="https://www.facebook.com/ivolunteerphils"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook Page
              </a>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center">
            <p className="text-gray-400 text-sm">&copy; 2026 Youth Service Philippines. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Program Detail Modal */}
      {showProgramDetail && selectedProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">{selectedProgram.title}</h2>
              <button
                onClick={() => {
                  setShowProgramDetail(false);
                  setSelectedProgram(null);
                }}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              {selectedProgram.image && (
                <img
                  src={selectedProgram.image}
                  alt={selectedProgram.title}
                  className="w-full h-64 md:h-96 object-cover rounded-lg mb-6"
                />
              )}
              <div className="prose max-w-none">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">About This Program</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedProgram.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chapter Application Modal */}
      {showChapterApplicationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Apply to Start a Chapter</h2>
              <button
                onClick={() => {
                  setShowChapterApplicationForm(false);
                  setChapterApplicationSubmitted(false);
                }}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              {!chapterApplicationSubmitted ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                    <input
                      type="text"
                      value={newChapterApplication.applicantName}
                      onChange={(e) => setNewChapterApplication({ ...newChapterApplication, applicantName: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Email</label>
                    <input
                      type="email"
                      value={newChapterApplication.applicantEmail}
                      onChange={(e) => setNewChapterApplication({ ...newChapterApplication, applicantEmail: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                      placeholder="Enter your email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chapter Name</label>
                    <input
                      type="text"
                      value={newChapterApplication.name}
                      onChange={(e) => setNewChapterApplication({ ...newChapterApplication, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                      placeholder="Enter the proposed chapter name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chapter Location</label>
                    <input
                      type="text"
                      value={newChapterApplication.location}
                      onChange={(e) => setNewChapterApplication({ ...newChapterApplication, location: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                      placeholder="Enter the chapter location"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chapter Description</label>
                    <textarea
                      value={newChapterApplication.description}
                      onChange={(e) => setNewChapterApplication({ ...newChapterApplication, description: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition h-24 resize-none"
                      placeholder="Describe the purpose and goals of this chapter"
                    />
                  </div>
                  <button
                    onClick={handleChapterApplication}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
                  >
                    Submit Application
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 mb-2">Application Submitted!</h4>
                  <p className="text-gray-600 mb-4">Thank you for your interest! Your chapter application has been submitted and is pending approval from our admin team.</p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> We will review your application and get back to you within 3-5 business days.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YSPWebsite;
