import React, { useEffect, useState, useMemo } from 'react';
import { BASE_URL } from '@/config';
import {
  Users, Search, UserPlus, Edit, Trash2, Shield,
  CheckCircle, XCircle, User as UserIcon,
  ChevronUp, ChevronDown, ArrowUpDown, Loader2,
  ArrowLeft, Camera,
} from 'lucide-react';
import {
  Card, CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

const roleLabels = { admin: 'Admin', 'super-admin': 'Super Admin', player: 'Player', user: 'User' };
const roleBadgeVariant = (role: string) => {
  if (role === 'super-admin') return 'destructive';
  if (role === 'admin') return 'default';
  if (role === 'player') return 'secondary';
  return 'outline';
};

const statCards = [
  { label: 'Total Users', key: 'total', icon: Users, gradient: 'from-blue-500 to-blue-600' },
  { label: 'Admins', key: 'admins', icon: Shield, gradient: 'from-purple-500 to-purple-600' },
  { label: 'Players', key: 'players', icon: UserIcon, gradient: 'from-green-500 to-emerald-600' },
  { label: 'Pending', key: 'pending', icon: XCircle, gradient: 'from-orange-500 to-amber-600' },
];

const UsersManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [pendingPlayers, setPendingPlayers] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<string>('joinDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogPreview, setDialogPreview] = useState<string | null>(null);

  // search/filter change → reset to page 1
  useEffect(() => { setPage(1); }, [searchTerm, filterRole, pageSize]);

  // fetch whenever page, search, or filter changes
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/users', {
          params: { page, limit: pageSize, search: searchTerm, role: filterRole === 'super-admin' ? 'super-admin' : filterRole },
        });
        const allUsers = res.data.users || [];
        const filtered = allUsers.filter((u: any) => u.role !== 'super-admin');
        setUsers(filtered);
        setTotalUsers(res.data.totalUsers || 0);
        setTotalAdmins(res.data.totalAdmins ?? 0);
        setTotalPlayers(res.data.totalPlayers ?? 0);
        setPendingPlayers(res.data.pendingPlayers ?? 0);
      } catch (error) {
        console.error('Failed to load users', error);
        toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page, pageSize, searchTerm, filterRole]);

  const totalPages = Math.ceil(totalUsers / pageSize) || 1;

  const sortedUsers = useMemo(() => {
    const list = [...users];
    list.sort((a, b) => {
      let aVal = a[sortField] ?? '';
      let bVal = b[sortField] ?? '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [users, sortField, sortDir]);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="inline ml-1 h-3 w-3 opacity-30" />;
    return sortDir === 'asc'
      ? <ChevronUp className="inline ml-1 h-3 w-3" />
      : <ChevronDown className="inline ml-1 h-3 w-3" />;
  };

  const allSelected = users.length > 0 && selected.size === users.length;
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(users.map(u => u.id)));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/users/${deleteTarget}`);
      setUsers(prev => prev.filter(u => u.id !== deleteTarget));
      setTotalUsers(prev => prev - 1);
      setSelected(prev => { const n = new Set(prev); n.delete(deleteTarget); return n; });
      toast({ title: 'User deleted' });
    } catch {
      toast({ title: 'Delete failed', description: 'Could not delete user', variant: 'destructive' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleToggleVerification = async (userId: string, current: boolean) => {
    try {
      const endpoint = current ? `/admin/reject-player/${userId}` : `/admin/verify-player/${userId}`;
      await api.patch(endpoint);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, verified: !current } : u));
      toast({ title: `Player ${current ? 'rejected' : 'verified'}` });
    } catch {
      toast({ title: 'Error', description: 'Verification toggle failed', variant: 'destructive' });
    }
  };

  const handleBulkVerify = async () => {
    const players = users.filter(u => selected.has(u.id) && u.role === 'player' && !u.verified);
    if (!players.length) { toast({ title: 'No unverified players selected' }); return; }
    try {
      await Promise.all(players.map(p => api.patch(`/admin/verify-player/${p.id}`)));
      setUsers(prev => prev.map(u => selected.has(u.id) && u.role === 'player' ? { ...u, verified: true } : u));
      toast({ title: `${players.length} player(s) verified` });
      setSelected(new Set());
    } catch { toast({ title: 'Bulk verify failed', variant: 'destructive' }); }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    try {
      await Promise.all([...selected].map(id => api.delete(`/admin/users/${id}`)));
      setUsers(prev => prev.filter(u => !selected.has(u.id)));
      setTotalUsers(prev => prev - selected.size);
      toast({ title: `${selected.size} user(s) deleted` });
      setSelected(new Set());
    } catch { toast({ title: 'Bulk delete failed', variant: 'destructive' }); }
  };

  const handleSaveUser = async () => {
    if (!editingUser?.name?.trim() || !editingUser?.email?.trim()) {
      toast({ title: 'Validation', description: 'Name and email are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(editingUser).forEach(([key, val]) => {
        if (key === 'profileImage' || key === 'documents') return;
        fd.append(key, String(val ?? ''));
      });
      if (editingUser.profileImage instanceof File) fd.append('profileImage', editingUser.profileImage);
      if (Array.isArray(editingUser.documents)) {
        editingUser.documents.forEach((f: any) => { if (f instanceof File) fd.append('documents', f); });
      }
      if (editingUser?.id) {
        await api.patch(`/admin/users/${editingUser.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast({ title: 'User updated' });
      } else {
        await api.post('/admin/users', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast({ title: 'User created' });
      }
      setIsDialogOpen(false);
      setEditingUser(null);
      setDialogPreview(null);
      setPage(1);
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openAddDialog = () => {
    setEditingUser({ name: '', email: '', role: 'user', phone: '', position: '', battingStyle: '', bowlingStyle: '', bio: '', dateOfBirth: '', playerCode: '' });
    setDialogPreview(null);
    setIsDialogOpen(true);
  };
  const openEditDialog = (user: any) => {
    setEditingUser({ ...user });
    setDialogPreview(null);
    setIsDialogOpen(true);
  };

  const stats = useMemo(() => ({
    total: totalUsers,
    admins: totalAdmins,
    players: totalPlayers,
    pending: pendingPlayers,
  }), [totalUsers, totalAdmins, totalPlayers, pendingPlayers]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 rounded-xl sm:rounded-2xl p-3 sm:p-5 md:p-6 text-white shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-center">
          Users Management
        </h1>
        <p className="text-white/70 text-xs sm:text-sm mt-1 uppercase text-center font-medium">Manage all registered users and players</p>
        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-9 bg-white/20 border-white/30 text-white placeholder:text-white/50 rounded-xl focus-visible:ring-white/50 w-full text-sm"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-lg leading-none">&times;</button>
          )}
        </div>
      </div>

      {/* Stats — hidden on mobile */}
      <div className="hidden sm:grid grid-cols-4 gap-2">
        {statCards.map(({ label, key, icon: Icon, gradient }) => (
          <Card key={key} className={`overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br ${gradient} text-white`}>
            <CardContent className="p-3 md:p-4 text-center">
              <Icon className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-1 opacity-80" />
              <p className="text-xl md:text-3xl font-black">{stats[key as keyof typeof stats]}</p>
              <p className="text-[10px] md:text-xs font-bold uppercase opacity-80 leading-tight">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Card */}
      <Card className="border-slate-200 shadow-sm sm:overflow-hidden overflow-visible">
        {/* Gradient header strip */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

        {/* Filter pills + bulk actions */}
        <div className="p-3 sm:p-5 pb-0">
          <div className="flex items-center gap-2 mb-3">
            {/* Mobile: dropdown */}
            <div className="flex-1 sm:hidden">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="h-9 rounded-lg border-slate-200 text-xs font-semibold">
                  <SelectValue>
                    {filterRole === 'all' ? 'All Users' : roleLabels[filterRole as keyof typeof roleLabels] || filterRole}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="player">Player</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Mobile: Add button */}
            <Button onClick={openAddDialog} className="sm:hidden shrink-0 h-9 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xs shadow-md">
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
            {/* Desktop: filter pills */}
            <div className="hidden sm:flex sm:flex-wrap sm:gap-2 flex-1">
              {['all', 'admin', 'player', 'user'].map(role => (
                <Button
                  key={role}
                  variant={filterRole === role ? 'default' : 'outline'}
                  onClick={() => setFilterRole(role)}
                  className={`capitalize h-9 px-5 text-sm rounded-full transition-all ${
                    filterRole === role ? 'shadow-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0' : ''
                  }`}
                >
                  {role === 'all' ? <Users className="h-3 w-3 mr-1" /> : null}
                  {role === 'all' ? 'All' : roleLabels[role as keyof typeof roleLabels] || role}
                </Button>
              ))}
            </div>
            {/* Desktop: Add button */}
            <Button onClick={openAddDialog} className="hidden sm:flex shrink-0 h-9 px-5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-sm shadow-md">
              <UserPlus className="h-4 w-4 mr-1.5" />
              Add User
            </Button>
          </div>

          <AnimatePresence>
            {selected.size > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 sm:gap-3 px-3 py-2 bg-blue-50/80 border border-blue-200 rounded-lg text-xs sm:text-sm">
                  <span className="font-medium text-blue-800">{selected.size} selected</span>
                  <Separator orientation="vertical" className="h-4 sm:h-5 bg-blue-200" />
                  <Button variant="outline" size="sm" onClick={handleBulkVerify} className="h-7 text-[10px] sm:text-xs border-blue-200 text-blue-700 hover:bg-blue-100">
                    <CheckCircle className="h-3 w-3 mr-1" /> Verify
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setBulkDeleteConfirm(true)} className="h-7 text-[10px] sm:text-xs border-red-200 text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())} className="h-7 text-[10px] sm:text-xs ml-auto">
                    Clear
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile: Modern card list */}
        <div className="sm:hidden divide-y divide-gray-100">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-11 w-11 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3 rounded-lg" />
                    <Skeleton className="h-3 w-1/2 rounded-lg" />
                  </div>
                </div>
              </div>
            ))
          ) : sortedUsers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <Users className="h-10 w-10 opacity-20" />
              <p className="font-semibold text-sm">No users found</p>
              <p className="text-xs text-muted-foreground">Try different search or filter</p>
            </div>
          ) : (
            sortedUsers.map((user, idx) => {
              return (
                <div
                  key={user.id}
                  className={`px-3 py-2.5 cursor-pointer transition-all ${selected.has(user.id) ? 'bg-blue-50/60 ring-2 ring-blue-400 ring-inset' : ''}`}
                  onClick={() => toggleOne(user.id)}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-sm font-black text-slate-500 shrink-0 w-5 text-center pt-1.5">{idx + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-white shadow-sm">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : null}
                      <span className="text-[11px] font-bold text-slate-600">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-[13px] text-slate-900 leading-tight block">{user.name}</span>
                      <p className="text-[11px] text-slate-400 mt-px truncate">{user.email}</p>
                      {user.role === 'player' && user.playerCode && (
                        <p className="text-[11px] text-blue-600 font-bold font-mono mt-px">{user.playerCode}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`inline-flex items-center px-1.5 py-px rounded-full text-[8px] font-bold uppercase tracking-wide ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'player' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {roleLabels[user.role as keyof typeof roleLabels] || user.role}
                        </span>
                        {user.role === 'player' && (
                          <span className={`inline-flex items-center px-1.5 py-px rounded-full text-[8px] font-bold ${
                            user.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {user.verified ? 'Verified' : 'Pending'}
                          </span>
                        )}
                        <span className="hidden sm:inline text-[10px] text-slate-400 ml-auto">
                          {user.joinDate && user.joinDate !== 'N/A' && new Date(user.joinDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 mt-1.5" onClick={e => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="h-7 px-2.5 text-[10px] font-semibold rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => openEditDialog(user)}>
                          Edit
                        </Button>
                        {user.role === 'player' && (
                          <Button variant="outline" size="sm" className={`h-7 px-2.5 text-[10px] font-semibold rounded-lg ${
                            user.verified ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'
                          }`}
                            onClick={() => handleToggleVerification(user.id, user.verified)}>
                            {user.verified ? 'Reject' : 'Verify'}
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="h-7 px-2.5 text-[10px] font-semibold rounded-lg border-red-200 text-red-500 hover:bg-red-50"
                          onClick={() => setDeleteTarget(user.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop: Modern professional table */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/80 border-b-2 border-slate-200/60">
                <TableHead className="w-12 pl-5 py-4">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="cursor-pointer select-none text-xs md:text-sm font-bold uppercase tracking-widest text-slate-500 py-4" onClick={() => toggleSort('name')}>
                  <span className="flex items-center gap-1">User <SortIcon field="name" /></span>
                </TableHead>
                <TableHead className="cursor-pointer select-none hidden lg:table-cell text-xs md:text-sm font-bold uppercase tracking-widest text-slate-500 py-4" onClick={() => toggleSort('email')}>
                  <span className="flex items-center gap-1">Email <SortIcon field="email" /></span>
                </TableHead>
                <TableHead className="cursor-pointer select-none text-xs md:text-sm font-bold uppercase tracking-widest text-slate-500 py-4" onClick={() => toggleSort('role')}>
                  <span className="flex items-center gap-1">Role <SortIcon field="role" /></span>
                </TableHead>
                <TableHead className="cursor-pointer select-none text-xs md:text-sm font-bold uppercase tracking-widest text-slate-500 py-4" onClick={() => toggleSort('verified')}>
                  <span className="flex items-center gap-1">Status <SortIcon field="verified" /></span>
                </TableHead>
                <TableHead className="text-right pr-5 text-xs md:text-sm font-bold uppercase tracking-widest text-slate-500 py-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j} className="py-3"><Skeleton className="h-9 w-full rounded-xl" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Users className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="font-semibold text-base text-slate-600">No users found</p>
                      <p className="text-sm text-slate-400">Try different search or filter terms</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedUsers.map((user, idx) => {
                  const roleColor = user.role === 'admin' ? 'from-purple-500 to-indigo-600' :
                                   user.role === 'player' ? 'from-green-500 to-emerald-600' :
                                   'from-slate-400 to-slate-500';
                  return (
                    <TableRow
                      key={user.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        selected.has(user.id) ? 'bg-blue-50/60 border-l-[3px] border-l-blue-500' : 'border-l-[3px] border-l-transparent'
                      } ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      } hover:bg-blue-50/20 border-b border-slate-100`}
                      onClick={() => toggleOne(user.id)}
                    >
                      <TableCell className="pl-5 py-3.5 md:py-4" onClick={e => e.stopPropagation()}>
                        <Checkbox checked={selected.has(user.id)} onCheckedChange={() => toggleOne(user.id)} />
                      </TableCell>
                      <TableCell className="py-3.5 md:py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${roleColor} flex items-center justify-center text-white font-bold text-sm md:text-base shadow-sm shrink-0`}>
                            {user.profileImage ? (
                              <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              user.name?.charAt(0)?.toUpperCase() || 'U'
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm md:text-base text-slate-900 truncate max-w-[200px] md:max-w-[280px]" title={user.name}>{user.name}</span>
                              {user.role === 'player' && user.verified && (
                                <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500 shrink-0" />
                              )}
                            </div>
                            {user.role === 'player' && user.playerCode && (
                              <div className="text-xs md:text-sm text-blue-600 font-bold font-mono mt-0.5">{user.playerCode}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-3.5 md:py-4">
                        <span className="text-sm md:text-base text-slate-500 max-w-[220px] md:max-w-[300px] truncate block" title={user.email}>{user.email}</span>
                      </TableCell>
                      <TableCell className="py-3.5 md:py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-wide ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'player' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {roleLabels[user.role as keyof typeof roleLabels] || user.role}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5 md:py-4">
                        {user.role === 'player' ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] md:text-xs font-bold ${
                            user.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {user.verified ? <CheckCircle className="h-3 w-3 md:h-3.5 md:w-3.5" /> : <XCircle className="h-3 w-3 md:h-3.5 md:w-3.5" />}
                            {user.verified ? 'Verified' : 'Pending'}
                          </span>
                        ) : (
                          <span className="text-sm md:text-base text-slate-300">&mdash;</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-5 py-3.5 md:py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          <Button variant="outline" size="sm" className="h-8 md:h-9 px-3 md:px-4 text-xs md:text-sm font-semibold rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors" onClick={() => openEditDialog(user)}>
                            Edit
                          </Button>
                          {user.role === 'player' && (
                            <Button variant="outline" size="sm" className={`h-8 md:h-9 px-3 md:px-4 text-xs md:text-sm font-semibold rounded-lg transition-colors ${
                              user.verified ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'
                            }`}
                              onClick={() => handleToggleVerification(user.id, user.verified)}>
                              {user.verified ? 'Reject' : 'Verify'}
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="h-8 md:h-9 px-3 md:px-4 text-xs md:text-sm font-semibold rounded-lg border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                            onClick={() => setDeleteTarget(user.id)}>
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-xs">Rows:</span>
          <Select value={String(pageSize)} onValueChange={v => setPageSize(Number(v))}>
            <SelectTrigger className="h-8 w-16 text-xs rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map(n => (
                <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-8 text-xs rounded-lg">
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  className={`h-8 w-8 p-0 text-xs rounded-lg ${p === page ? '' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              );
            })}
          </div>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-8 text-xs rounded-lg">
            Next
          </Button>
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={v => { setIsDialogOpen(v); if (!v) { setEditingUser(null); setDialogPreview(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">{editingUser?.id ? 'Edit User' : 'Add New User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Info Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Basic Information</span>
                <Separator className="flex-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Full Name *</Label>
                  <Input value={editingUser?.name || ''} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Email *</Label>
                  <Input type="email" value={editingUser?.email || ''} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Phone</Label>
                  <Input value={editingUser?.phone || ''} onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Role</Label>
                  <Select value={editingUser?.role || 'user'} onValueChange={v => setEditingUser({ ...editingUser, role: v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="player">Player</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Date of Birth</Label>
                  <Input type="date" value={editingUser?.dateOfBirth || ''} onChange={e => setEditingUser({ ...editingUser, dateOfBirth: e.target.value })} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Profile Image</Label>
                  <div className="flex items-center gap-3">
                    <label className="relative shrink-0 cursor-pointer group">
                      {editingUser?.profileImage || dialogPreview ? (
                        <img
                          src={dialogPreview || editingUser.profileImage}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-border group-hover:ring-blue-400 transition-all"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground ring-2 ring-border group-hover:ring-blue-400 transition-all">
                          <UserIcon className="h-5 w-5" />
                        </div>
                      )}
                      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="h-5 w-5 text-white" />
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setEditingUser({ ...editingUser, profileImage: f });
                          setDialogPreview(URL.createObjectURL(f));
                        }
                      }} />
                    </label>
                    <span className="text-xs text-muted-foreground">Click to upload photo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Player Details Section (conditional) */}
            {editingUser?.role === 'player' && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Player Details</span>
                  <Separator className="flex-1" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Player Code</Label>
                    <Input value={editingUser?.playerCode || ''} onChange={e => setEditingUser({ ...editingUser, playerCode: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Position</Label>
                    <Select value={editingUser?.position || ''} onValueChange={v => setEditingUser({ ...editingUser, position: v })}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select position" /></SelectTrigger>
                      <SelectContent>
                        {['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'].map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Batting Style</Label>
                    <Select value={editingUser?.battingStyle || ''} onValueChange={v => setEditingUser({ ...editingUser, battingStyle: v })}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {['Right-handed', 'Left-handed'].map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Bowling Style</Label>
                    <Select value={editingUser?.bowlingStyle || ''} onValueChange={v => setEditingUser({ ...editingUser, bowlingStyle: v })}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {['Fast', 'Fast-medium', 'Medium', 'Off-spin', 'Leg-spin', 'Left-arm orthodox', 'Left-arm chinaman'].map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-xs font-medium">Bio</Label>
                    <Textarea rows={2} value={editingUser?.bio || ''} onChange={e => setEditingUser({ ...editingUser, bio: e.target.value })} className="text-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <Button onClick={handleSaveUser} disabled={saving} className="w-full h-10 rounded-xl text-sm">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingUser?.id ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90 rounded-lg text-sm">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={() => setBulkDeleteConfirm(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} Users?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. These users and all associated data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { handleBulkDelete(); setBulkDeleteConfirm(false); }} className="bg-destructive hover:bg-destructive/90 rounded-lg text-sm">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsersManagement;
