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
  { label: 'Total Users', key: 'total', icon: Users, color: 'text-blue-600 bg-blue-100' },
  { label: 'Admins', key: 'admins', icon: Shield, color: 'text-purple-600 bg-purple-100' },
  { label: 'Players', key: 'players', icon: UserIcon, color: 'text-green-600 bg-green-100' },
  { label: 'Pending', key: 'pending', icon: XCircle, color: 'text-amber-600 bg-amber-100' },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 space-y-6">
      {/* Header: title left, search center, button right */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="outline" size="sm" onClick={() => window.history.back()} className="h-9 w-9 p-0 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent whitespace-nowrap">
            Users Management
          </h1>
        </div>
        <div className="relative flex-1 max-w-xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-10 bg-white border-slate-200 rounded-xl shadow-sm focus-visible:ring-blue-400 w-full text-sm"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
          )}
        </div>
        <Button onClick={openAddDialog} className="shrink-0 h-10 rounded-xl shadow-sm">
          <UserPlus className="h-4 w-4 mr-1.5" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map(({ label, key, icon: Icon, color }) => (
          <Card key={key} className="overflow-hidden">
            <CardContent className="p-4 sm:p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground truncate">{label}</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats[key as keyof typeof stats]}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        {/* Gradient header strip */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

        {/* Filter pills + bulk actions inside card */}
        <div className="p-5 pb-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            {['all', 'admin', 'player', 'user'].map(role => (
              <Button
                key={role}
                variant={filterRole === role ? 'default' : 'outline'}
                onClick={() => setFilterRole(role)}
                className={`capitalize h-10 px-5 text-sm rounded-full transition-all ${
                  filterRole === role ? 'shadow-sm' : ''
                }`}
              >
                {role === 'all' ? <Users className="h-3.5 w-3.5 mr-1.5" /> : null}
                {role === 'all' ? 'All' : roleLabels[role as keyof typeof roleLabels] || role}
              </Button>
            ))}
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
                <div className="flex items-center gap-3 px-3 py-2 bg-blue-50/80 border border-blue-200 rounded-lg text-sm">
                  <span className="font-medium text-blue-800">{selected.size} selected</span>
                  <Separator orientation="vertical" className="h-5 bg-blue-200" />
                  <Button variant="outline" size="sm" onClick={handleBulkVerify} className="h-7 text-xs border-blue-200 text-blue-700 hover:bg-blue-100">
                    <CheckCircle className="h-3 w-3 mr-1" /> Verify
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setBulkDeleteConfirm(true)} className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())} className="h-7 text-xs ml-auto">
                    Clear
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 border-b-2 border-slate-100">
                <TableHead className="w-12 pl-5 py-4">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="cursor-pointer select-none text-sm font-semibold uppercase tracking-wider text-slate-500 py-4" onClick={() => toggleSort('name')}>
                  User <SortIcon field="name" />
                </TableHead>
                <TableHead className="cursor-pointer select-none hidden md:table-cell text-sm font-semibold uppercase tracking-wider text-slate-500 py-4" onClick={() => toggleSort('email')}>
                  Email <SortIcon field="email" />
                </TableHead>
                <TableHead className="cursor-pointer select-none text-sm font-semibold uppercase tracking-wider text-slate-500 py-4" onClick={() => toggleSort('role')}>
                  Role <SortIcon field="role" />
                </TableHead>
                <TableHead className="cursor-pointer select-none text-sm font-semibold uppercase tracking-wider text-slate-500 py-4" onClick={() => toggleSort('verified')}>
                  Status <SortIcon field="verified" />
                </TableHead>
                <TableHead className="cursor-pointer select-none hidden lg:table-cell text-sm font-semibold uppercase tracking-wider text-slate-500 py-4" onClick={() => toggleSort('joinDate')}>
                  Joined <SortIcon field="joinDate" />
                </TableHead>
                <TableHead className="text-right pr-5 text-sm font-semibold uppercase tracking-wider text-slate-500 py-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j} className="py-2"><Skeleton className="h-8 w-full rounded-lg" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-10 w-10 opacity-20" />
                      <p className="font-medium">No users found</p>
                      <p className="text-xs">Try different search or filter terms</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedUsers.map((user, idx) => (
                    <TableRow
                    key={user.id}
                    className={`cursor-pointer transition-colors ${
                      selected.has(user.id) ? 'bg-blue-50/50' : ''
                    } ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                    } hover:bg-blue-50/30 border-b border-slate-100`}
                    onClick={() => toggleOne(user.id)}
                  >
                    <TableCell className="pl-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <Checkbox checked={selected.has(user.id)} onCheckedChange={() => toggleOne(user.id)} />
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={user.profileImage || `${BASE_URL}/favicon.png`}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                          />
                          {user.role === 'player' && user.verified && (
                            <span className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full p-0.5 ring-1 ring-white">
                              <CheckCircle className="h-2.5 w-2.5 text-white" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-base text-slate-800 truncate max-w-[180px]" title={user.name}>{user.name}</div>
                          {user.role === 'player' && user.playerCode && (
                            <div className="text-xs text-muted-foreground font-mono">{user.playerCode}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-3.5 text-sm text-slate-500 max-w-[220px] truncate" title={user.email}>
                      {user.email}
                    </TableCell>
                    <TableCell className="py-3.5">
                      <Badge variant={roleBadgeVariant(user.role)} className="capitalize text-xs px-3 py-1">
                        {roleLabels[user.role as keyof typeof roleLabels] || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5">
                      {user.role === 'player' ? (
                        <Badge variant={user.verified ? 'default' : 'secondary'} className="gap-1.5 text-xs px-3 py-1">
                          {user.verified ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          {user.verified ? 'Verified' : 'Pending'}
                        </Badge>
                      ) : (
                        <span className="text-sm text-slate-300">&mdash;</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell py-3.5 text-sm text-slate-400">
                      {user.joinDate && user.joinDate !== 'N/A'
                        ? new Date(user.joinDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right pr-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-slate-200/60" onClick={() => openEditDialog(user)} title="Edit user">
                          <Edit className="h-4 w-4 text-slate-500" />
                        </Button>
                        {user.role === 'player' && (
                          <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-slate-200/60"
                            onClick={() => handleToggleVerification(user.id, user.verified)} title={user.verified ? 'Reject player verification' : 'Verify player'}>
                            {user.verified
                              ? <XCircle className="h-4 w-4 text-red-400" />
                              : <CheckCircle className="h-4 w-4 text-green-400" />}
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-red-50"
                          onClick={() => setDeleteTarget(user.id)} title="Delete user">
                          <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
