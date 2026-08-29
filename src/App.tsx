import React, { useState, useEffect, useMemo } from 'react';
import { BoulderBlock, Wall, UserProposal, UserProfile, UserBlockProgress, Gym } from './types';
import { MOCK_BLOCKS, MOCK_WALLS, MOCK_PROPOSALS, MOCK_GYMS } from './data/mockData';
import { getLevelForGrade } from './utils/gradeUtils';
import { 
  seedInitialDataIfEmpty,
  subscribeToAuth, 
  subscribeToGyms,
  subscribeToWalls, 
  subscribeToBlocks, 
  subscribeToProposals, 
  subscribeToUserProgress,
  saveGymToFirestore,
  deleteGymFromFirestore,
  joinGymInFirestore,
  saveBlockToFirestore,
  deleteBlockFromFirestore,
  saveProposalToFirestore,
  updateProposalStatusInFirestore,
  saveUserBlockProgressInFirestore,
  deleteUserProgressDocInFirestore,
  ensureUserDoc,
  checkIsAdmin,
  isSuperAdminEmail,
  isUserGymSetter
} from './lib/firebase';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './views/HomeView';
import { BlocksView } from './views/BlocksView';
import { WallsView } from './views/WallsView';
import { ProgressView } from './views/ProgressView';
import { AdminView } from './views/AdminView';
import { GymsDirectoryView } from './views/GymsDirectoryView';
import { BlockDetailModal } from './components/BlockDetailModal';
import { ProposeBlockModal } from './views/ProposeBlockModal';
import { GraduationsModal } from './views/GraduationsModal';

export const App: React.FC = () => {
  // Navigation State - Landing is the list of all climbing gyms (gyms directory)
  const [currentTab, setCurrentTab] = useState<string>('gyms');
  const [blocksFilterLevel, setBlocksFilterLevel] = useState<string | undefined>(undefined);
  const [blocksFilterWallId, setBlocksFilterWallId] = useState<string | undefined>(undefined);

  // Authentication State (Real Firebase Auth)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Core Multi-Gym Data State
  const [gyms, setGyms] = useState<Gym[]>(() => MOCK_GYMS);
  const [activeGym, setActiveGym] = useState<Gym>(() => MOCK_GYMS[0]);

  const [blocks, setBlocks] = useState<BoulderBlock[]>(() => {
    return MOCK_BLOCKS.map(b => ({ ...b, level: getLevelForGrade(b.grade) }));
  });

  const [walls, setWalls] = useState<Wall[]>(() => MOCK_WALLS);
  const [userProgress, setUserProgress] = useState<Record<string, UserBlockProgress>>({});
  const [proposals, setProposals] = useState<UserProposal[]>(() => MOCK_PROPOSALS);

  // Modals
  const [selectedBlock, setSelectedBlock] = useState<BoulderBlock | null>(null);
  const [showProposeModal, setShowProposeModal] = useState<boolean>(false);
  const [showGraduationsModal, setShowGraduationsModal] = useState<boolean>(false);

  const isSuperAdmin = isSuperAdminEmail(currentUser?.email);
  const isSetter = isUserGymSetter(activeGym, currentUser?.email);
  const canAccessAdmin = isSuperAdmin || isSetter;

  // Initialize Firebase & Realtime Subscriptions
  useEffect(() => {
    // 1. Seed initial gyms, walls, blocks, and admins in Firestore if empty
    seedInitialDataIfEmpty();

    // 2. Auth listener with admin role check
    const unsubscribeAuth = subscribeToAuth(async (authUser) => {
      if (authUser) {
        try {
          const profile = await ensureUserDoc(authUser);
          const isAdmin = await checkIsAdmin(authUser.email);
          const userWithRole: UserProfile = {
            ...profile,
            role: isAdmin ? 'admin' : 'user',
          };
          setCurrentUser(userWithRole);
        } catch (e) {
          console.error('Error loading user profile:', e);
        }
      } else {
        setCurrentUser(null);
        setUserProgress({});
      }
    });

    // 3. Realtime Firestore data subscriptions
    const unsubGyms = subscribeToGyms((remoteGyms) => {
      if (remoteGyms && remoteGyms.length > 0) {
        setGyms(remoteGyms);
        // Keep activeGym synced with updated data
        setActiveGym(prev => {
          const matched = remoteGyms.find(g => g.id === prev.id);
          return matched || remoteGyms[0];
        });
      }
    });

    const unsubWalls = subscribeToWalls((remoteWalls) => {
      if (remoteWalls && remoteWalls.length > 0) {
        setWalls(remoteWalls);
      }
    });

    const unsubBlocks = subscribeToBlocks((remoteBlocks) => {
      if (remoteBlocks && remoteBlocks.length > 0) {
        setBlocks(remoteBlocks);
      }
    });

    const unsubProposals = subscribeToProposals((remoteProposals) => {
      if (remoteProposals) {
        setProposals(remoteProposals);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubGyms) unsubGyms();
      if (unsubWalls) unsubWalls();
      if (unsubBlocks) unsubBlocks();
      if (unsubProposals) unsubProposals();
    };
  }, []);

  // Listen to User Progress when user is logged in
  useEffect(() => {
    if (currentUser?.id) {
      const unsubProg = subscribeToUserProgress(currentUser.id, (prog) => {
        setUserProgress(prog);
      });
      return () => {
        if (unsubProg) unsubProg();
      };
    }
  }, [currentUser?.id]);

  // Scoped Data for the Active Gym
  const activeGymBlocks = useMemo(() => {
    return blocks.filter(b => !b.gymId || b.gymId === activeGym.id);
  }, [blocks, activeGym.id]);

  const activeGymWalls = useMemo(() => {
    return walls.filter(w => !w.gymId || w.gymId === activeGym.id);
  }, [walls, activeGym.id]);

  const activeGymProposals = useMemo(() => {
    return proposals.filter(p => !p.gymId || p.gymId === activeGym.id);
  }, [proposals, activeGym.id]);

  // Handlers
  const handleNavigate = (tab: string, filter?: { level?: string; wallId?: string }) => {
    if (filter) {
      setBlocksFilterLevel(filter.level);
      setBlocksFilterWallId(filter.wallId);
    } else if (tab === 'blocks') {
      setBlocksFilterLevel(undefined);
      setBlocksFilterWallId(undefined);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectGym = (gym: Gym) => {
    setActiveGym(gym);
    setCurrentTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJoinGym = async (gymId: string, isUnlockedPrivate: boolean = false) => {
    if (currentUser?.id) {
      try {
        await joinGymInFirestore(currentUser.id, gymId, isUnlockedPrivate);
        setCurrentUser(prev => {
          if (!prev) return null;
          const prevJoined = prev.joinedGymIds || [];
          const prevUnlocked = prev.unlockedPrivateGymIds || [];
          return {
            ...prev,
            joinedGymIds: Array.from(new Set([...prevJoined, gymId])),
            unlockedPrivateGymIds: isUnlockedPrivate 
              ? Array.from(new Set([...prevUnlocked, gymId]))
              : prevUnlocked,
          };
        });
      } catch (err) {
        console.error('Error joining gym in Firestore:', err);
      }
    }
  };

  const handleCreateGym = async (newGym: Partial<Gym>) => {
    const fullGym: Gym = {
      id: newGym.id || `gym-${Date.now()}`,
      slug: newGym.slug || 'rocódromo',
      name: newGym.name || 'Nuevo Rocódromo',
      subtitle: newGym.subtitle,
      description: newGym.description || '',
      city: newGym.city || 'Murcia',
      location: newGym.location || 'Murcia',
      type: newGym.type || 'public',
      accessCode: newGym.accessCode,
      imageUrl: newGym.imageUrl || 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=1200&q=80',
      setters: newGym.setters || [currentUser?.email || ''],
      createdBy: currentUser?.email || 'Admin',
      createdAt: new Date().toISOString().split('T')[0],
      features: newGym.features || ['Boulder'],
      openingHours: newGym.openingHours || '09:00 - 22:00',
      activeWallsCount: 0,
      activeBlocksCount: 0,
    };

    setGyms(prev => [...prev, fullGym]);
    try {
      await saveGymToFirestore(fullGym);
    } catch (err) {
      console.error('Error creating gym in Firestore:', err);
    }
  };

  const handleEditGym = async (updatedGym: Gym) => {
    setGyms(prev => prev.map(g => g.id === updatedGym.id ? updatedGym : g));
    if (activeGym.id === updatedGym.id) {
      setActiveGym(updatedGym);
    }
    try {
      await saveGymToFirestore(updatedGym);
    } catch (err) {
      console.error('Error updating gym in Firestore:', err);
    }
  };

  const handleDeleteGym = async (gymId: string) => {
    setGyms(prev => prev.filter(g => g.id !== gymId));
    if (activeGym.id === gymId) {
      const remaining = gyms.filter(g => g.id !== gymId);
      if (remaining.length > 0) {
        setActiveGym(remaining[0]);
      }
    }
    try {
      await deleteGymFromFirestore(gymId);
    } catch (err) {
      console.error('Error deleting gym from Firestore:', err);
    }
  };

  const handleUpdateBlockProgress = async (updated: Partial<UserBlockProgress>) => {
    if (!selectedBlock) return;
    const current = userProgress[selectedBlock.id] || {
      blockId: selectedBlock.id,
      status: 'untried',
      favorite: false,
    };

    const newProgress: UserBlockProgress = {
      ...current,
      ...updated,
      gymId: selectedBlock.gymId || activeGym.id,
      updatedAt: new Date().toISOString().split('T')[0],
      blockName: selectedBlock.name,
      grade: selectedBlock.grade,
      wallName: selectedBlock.wallName,
    };

    // Update local state immediately for fast response
    setUserProgress(prev => ({
      ...prev,
      [selectedBlock.id]: newProgress,
    }));

    // Sync to Firestore if authenticated
    if (currentUser?.id) {
      try {
        await saveUserBlockProgressInFirestore(currentUser.id, selectedBlock.id, newProgress);
      } catch (err) {
        console.error('Error saving progress to Firestore:', err);
      }
    }
  };

  const handleToggleFavorite = async (blockId: string) => {
    const current = userProgress[blockId] || {
      blockId,
      status: 'untried',
      favorite: false,
    };

    const targetBlock = blocks.find(b => b.id === blockId);

    const newProgress: UserBlockProgress = {
      ...current,
      favorite: !current.favorite,
      gymId: targetBlock?.gymId || activeGym.id,
      updatedAt: new Date().toISOString().split('T')[0],
      blockName: targetBlock?.name || current.blockName || 'Bloque',
      grade: targetBlock?.grade || current.grade || '6A',
      wallName: targetBlock?.wallName || current.wallName || 'Rocódromo',
    };

    setUserProgress(prev => ({
      ...prev,
      [blockId]: newProgress,
    }));

    if (currentUser?.id) {
      try {
        await saveUserBlockProgressInFirestore(currentUser.id, blockId, newProgress);
      } catch (err) {
        console.error('Error saving favorite to Firestore:', err);
      }
    }
  };

  const handleToggleBlockStatus = async (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const nextStatus = block.status === 'active' ? 'retired' : 'active';
    const updatedBlock: BoulderBlock = {
      ...block,
      status: nextStatus,
      retiredAt: nextStatus === 'retired' ? new Date().toISOString().split('T')[0] : undefined,
    };

    setBlocks(blocks.map(b => b.id === blockId ? updatedBlock : b));

    try {
      await saveBlockToFirestore(updatedBlock);
    } catch (err) {
      console.error('Error updating block status in Firestore:', err);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    const blockToDelete = blocks.find(b => b.id === blockId);

    const nextProgress = { ...userProgress };
    if (nextProgress[blockId]) {
      if (nextProgress[blockId].status === 'completed') {
        const obsoleteProg: UserBlockProgress = {
          ...nextProgress[blockId],
          isObsolete: true,
          blockName: blockToDelete?.name || nextProgress[blockId].blockName || 'Bloque Retirado',
          grade: blockToDelete?.grade || nextProgress[blockId].grade || '6A',
          wallName: blockToDelete?.wallName || nextProgress[blockId].wallName || 'Rocódromo',
        };
        nextProgress[blockId] = obsoleteProg;
        if (currentUser?.id) {
          saveUserBlockProgressInFirestore(currentUser.id, blockId, obsoleteProg).catch(console.error);
        }
      } else {
        delete nextProgress[blockId];
        if (currentUser?.id) {
          deleteUserProgressDocInFirestore(currentUser.id, blockId).catch(console.error);
        }
      }
      setUserProgress(nextProgress);
    }

    setBlocks(blocks.filter(b => b.id !== blockId));

    try {
      await deleteBlockFromFirestore(blockId);
    } catch (err) {
      console.error('Error deleting block from Firestore:', err);
    }
  };

  const handleDeleteObsoleteProgress = async (blockId: string) => {
    const next = { ...userProgress };
    delete next[blockId];
    setUserProgress(next);

    if (currentUser?.id) {
      try {
        await deleteUserProgressDocInFirestore(currentUser.id, blockId);
      } catch (err) {
        console.error('Error deleting obsolete progress from Firestore:', err);
      }
    }
  };

  const handleApproveProposal = async (proposalId: string) => {
    const prop = proposals.find(p => p.id === proposalId);
    if (!prop) return;

    const newBlockId = `block-${Date.now()}`;

    const newBlock: BoulderBlock = {
      id: newBlockId,
      gymId: prop.gymId || activeGym.id,
      name: prop.name || `Bloque ${prop.grade} (${prop.wallName})`,
      grade: prop.grade,
      level: getLevelForGrade(prop.grade),
      wallId: prop.wallId,
      wallName: prop.wallName,
      description: prop.notes || 'Bloque propuesto por la comunidad y aprobado por los equipadores.',
      tags: prop.tags,
      status: 'active',
      imageUrl: prop.imageUrl,
      markers: prop.markers,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: prop.userName,
      proposedByUserId: prop.userId,
      proposalId: prop.id,
      favoritesCount: 0,
    };

    setBlocks([newBlock, ...blocks]);
    setProposals(proposals.map(p => p.id === proposalId ? { 
      ...p, 
      status: 'approved',
      officialBlockId: newBlockId,
      approvedAt: new Date().toISOString().split('T')[0]
    } : p));

    try {
      await saveBlockToFirestore(newBlock);
      await updateProposalStatusInFirestore(proposalId, 'approved', newBlockId);
    } catch (err) {
      console.error('Error approving proposal in Firestore:', err);
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    setProposals(proposals.map(p => p.id === proposalId ? { ...p, status: 'rejected' } : p));
    try {
      await updateProposalStatusInFirestore(proposalId, 'rejected');
    } catch (err) {
      console.error('Error rejecting proposal in Firestore:', err);
    }
  };

  const handleReopenProposal = async (proposalId: string) => {
    setProposals(proposals.map(p => p.id === proposalId ? { ...p, status: 'pending' } : p));
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('./lib/firebase');
      await updateDoc(doc(db, 'proposals', proposalId), { status: 'pending' });
    } catch (err) {
      console.error('Error reopening proposal in Firestore:', err);
    }
  };

  const handleDeleteProposal = async (proposalId: string) => {
    setProposals(proposals.filter(p => p.id !== proposalId));
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('./lib/firebase');
      await deleteDoc(doc(db, 'proposals', proposalId));
    } catch (err) {
      console.error('Error deleting proposal from Firestore:', err);
    }
  };

  const handleSubmitNewProposal = async (newProposal: UserProposal) => {
    setProposals([newProposal, ...proposals]);
    try {
      await saveProposalToFirestore(newProposal);
    } catch (err) {
      console.error('Error saving new proposal to Firestore:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-200 flex flex-col">
      {/* Desktop Header */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        activeGym={activeGym}
        gyms={gyms}
        onSelectGym={handleSelectGym}
        onOpenProposeModal={() => setShowProposeModal(true)}
        onOpenGymsDirectory={() => handleNavigate('gyms')}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {/* Gyms Directory / Selection View */}
        {currentTab === 'gyms' && (
          <GymsDirectoryView
            gyms={gyms}
            currentUser={currentUser}
            activeGym={activeGym}
            onSelectGym={handleSelectGym}
            onJoinGym={handleJoinGym}
            onCreateGym={handleCreateGym}
            onEditGym={handleEditGym}
            onDeleteGym={handleDeleteGym}
          />
        )}

        {currentTab === 'home' && (
          <HomeView
            blocks={activeGymBlocks}
            walls={activeGymWalls}
            currentUser={currentUser}
            activeGym={activeGym}
            userProgress={userProgress}
            onNavigate={handleNavigate}
            onSelectBlock={(b) => setSelectedBlock(b)}
            onOpenGraduationsModal={() => setShowGraduationsModal(true)}
            onOpenGymsDirectory={() => handleNavigate('gyms')}
          />
        )}

        {currentTab === 'blocks' && (
          <BlocksView
            blocks={activeGymBlocks}
            walls={activeGymWalls}
            currentUser={currentUser}
            userProgress={userProgress}
            initialLevel={blocksFilterLevel}
            initialWallId={blocksFilterWallId}
            onSelectBlock={(b) => setSelectedBlock(b)}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {currentTab === 'walls' && (
          <WallsView
            walls={activeGymWalls}
            blocks={activeGymBlocks}
            activeGym={activeGym}
            onSelectWall={(wallId) => handleNavigate('blocks', { wallId })}
          />
        )}

        {currentTab === 'progress' && (
          <ProgressView
            currentUser={currentUser}
            blocks={blocks}
            userProgress={userProgress}
            proposals={proposals}
            onSelectBlock={(b) => setSelectedBlock(b)}
            onToggleFavorite={handleToggleFavorite}
            onOpenProposeModal={() => setShowProposeModal(true)}
            onDeleteObsoleteProgress={handleDeleteObsoleteProgress}
          />
        )}

        {currentTab === 'admin' && canAccessAdmin && (
          <AdminView
            blocks={activeGymBlocks}
            walls={activeGymWalls}
            proposals={activeGymProposals}
            currentUser={currentUser}
            activeGym={activeGym}
            gyms={gyms}
            onSelectGym={handleSelectGym}
            onUpdateGym={handleEditGym}
            onToggleBlockStatus={handleToggleBlockStatus}
            onDeleteBlock={handleDeleteBlock}
            onApproveProposal={handleApproveProposal}
            onRejectProposal={handleRejectProposal}
            onReopenProposal={handleReopenProposal}
            onDeleteProposal={handleDeleteProposal}
            onOpenCreateBlock={() => setShowProposeModal(true)}
            onSelectBlock={(b) => setSelectedBlock(b)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        activeGym={activeGym}
        onOpenProposeModal={() => setShowProposeModal(true)}
        onOpenGymsDirectory={() => handleNavigate('gyms')}
      />

      {/* Block Detail Modal */}
      {selectedBlock && (
        <BlockDetailModal
          block={selectedBlock}
          userProgress={userProgress[selectedBlock.id]}
          isLoggedIn={!!currentUser}
          onClose={() => setSelectedBlock(null)}
          onUpdateProgress={handleUpdateBlockProgress}
          onToggleFavorite={() => handleToggleFavorite(selectedBlock.id)}
        />
      )}

      {/* Propose Block Modal (Interactive Editor) */}
      {showProposeModal && currentUser && (
        <ProposeBlockModal
          walls={activeGymWalls}
          currentUser={currentUser}
          gymId={activeGym.id}
          onClose={() => setShowProposeModal(false)}
          onSubmitProposal={handleSubmitNewProposal}
        />
      )}

      {/* Graduations Info Guide Modal */}
      {showGraduationsModal && (
        <GraduationsModal
          onClose={() => setShowGraduationsModal(false)}
          onSelectLevel={(level) => handleNavigate('blocks', { level })}
        />
      )}
    </div>
  );
};

export default App;
