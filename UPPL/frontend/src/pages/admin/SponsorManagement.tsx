import React, { useEffect, useState, useMemo } from 'react';
import {
  Building2, UserCircle, Users, ChevronLeft, ChevronRight, Pencil, Trash2, Plus,
  QrCode, CircleDollarSign, ShieldCheck, Search, X, Globe, Mail, Phone, ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import PaymentQRForm from '@/components/PaymentQRForm';

const ITEMS_PER_PAGE = 6;

const getImageUrl = (img: any): string => {
  if (!img) return '';
  if (typeof img === 'object') return img.url || img.secure_url || '';
  if (typeof img === 'string' && img.startsWith('http')) return img;
  return '';
};

const SponsorManagement = () => {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgPage, setOrgPage] = useState(1);
  const [indPage, setIndPage] = useState(1);
  const [orgSearch, setOrgSearch] = useState('');
  const [indSearch, setIndSearch] = useState('');
  const [orgSort, setOrgSort] = useState('default');
  const [indSort, setIndSort] = useState('default');
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [selectedIndIds, setSelectedIndIds] = useState<string[]>([]);

  // Form modal
  const [modal, setModal] = useState<{ type: 'organization' | 'individual'; sponsor?: any } | null>(null);
  const [formData, setFormData] = useState({
    name: '', bio: '', donationAmount: '', title: '', isActive: true,
    displayOrder: 0,
    website: '', email: '', phone: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Lightbox
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Team
  const [teamOpen, setTeamOpen] = useState(false);
  const [team, setTeam] = useState<any[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [memberForm, setMemberForm] = useState<any>(null);

  const fetchSponsors = async () => {
    try {
      setLoading(true);
      const params = (sort: string) => sort === 'donation' ? '?sortBy=donation&sortDir=desc' : '';
      const [orgRes, indRes] = await Promise.all([
        api.get(`/sponsors/organizations${params(orgSort)}`),
        api.get(`/sponsors/individuals${params(indSort)}`),
      ]);
      setOrgs(Array.isArray(orgRes.data) ? orgRes.data : []);
      setPeople(Array.isArray(indRes.data) ? indRes.data : []);
    } catch {
      toast({ title: 'Failed to fetch sponsors', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchSponsors(); }, [orgSort, indSort]);

  const fetchTeam = async () => {
    try {
      setTeamLoading(true);
      const res = await api.get('/team-members');
      setTeam(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast({ title: 'Failed to fetch team', variant: 'destructive' });
    } finally { setTeamLoading(false); }
  };

  useEffect(() => { fetchTeam(); }, []);

  const openForm = (type: 'organization' | 'individual', sponsor?: any) => {
    setModal({ type, sponsor });
    setFormData({
      name: sponsor?.name || '', bio: sponsor?.bio || '',
      donationAmount: sponsor?.donationAmount || '',
      title: sponsor?.title || '', isActive: sponsor?.isActive ?? true,
      displayOrder: sponsor?.displayOrder || 0,
      website: sponsor?.website || '', email: sponsor?.email || '', phone: sponsor?.phone || '',
    });
    setSelectedFile(null);
    setImagePreview(sponsor?.logo?.url || sponsor?.avatar?.url || '');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setSelectedFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const isOrg = modal?.type === 'organization';
    const endpoint = `/sponsors/${isOrg ? 'organizations' : 'individuals'}`;
    const isEdit = !!modal?.sponsor;
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('bio', formData.bio);
      fd.append('donationAmount', String(formData.donationAmount));
      fd.append('isActive', String(formData.isActive));
      fd.append('displayOrder', String(formData.displayOrder));
      if (!isOrg) fd.append('title', formData.title);
      if (isOrg) {
        fd.append('website', formData.website);
        fd.append('email', formData.email);
        fd.append('phone', formData.phone);
      }
      if (selectedFile) fd.append(isOrg ? 'logo' : 'avatar', selectedFile);

      if (isEdit) {
        await api.put(`${endpoint}/${modal!.sponsor._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast({ title: `${isOrg ? 'Organization' : 'Individual'} updated` });
      } else {
        await api.post(endpoint, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast({ title: `${isOrg ? 'Organization' : 'Individual'} created` });
      }
      setModal(null);
      fetchSponsors();
    } catch { toast({ title: 'Failed to save sponsor', variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };

  const handleDeleteSponsor = async (type: 'organization' | 'individual', id: string) => {
    if (!window.confirm('Delete this sponsor?')) return;
    try {
      await api.delete(`/sponsors/${type === 'organization' ? 'organizations' : 'individuals'}/${id}`);
      toast({ title: 'Sponsor deleted' });
      fetchSponsors();
    } catch (err) {
      console.error('Delete sponsor error:', err);
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  const handleBulkToggle = async (type: 'organization' | 'individual', isActive: boolean) => {
    const ids = type === 'organization' ? selectedOrgIds : selectedIndIds;
    if (!ids.length) return;
    try {
      await api.patch('/sponsors/bulk/toggle', { ids, isActive, type });
      toast({ title: `${ids.length} sponsor(s) updated` });
      setSelectedOrgIds([]); setSelectedIndIds([]);
      fetchSponsors();
    } catch { toast({ title: 'Bulk action failed', variant: 'destructive' }); }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    try {
      if (memberForm?._id) {
        await api.put(`/team-members/${memberForm._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast({ title: 'Member updated' });
      } else {
        await api.post('/team-members', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast({ title: 'Member created' });
      }
      setMemberForm(null);
      fetchTeam();
    } catch { toast({ title: 'Failed to save member', variant: 'destructive' }); }
  };

  const handleDeleteMember = async (id: string) => {
    if (!window.confirm('Delete this team member?')) return;
    try {
      await api.delete(`/team-members/${id}`);
      toast({ title: 'Member deleted' });
      fetchTeam();
    } catch { toast({ title: 'Delete failed', variant: 'destructive' }); }
  };

  const filterList = (list: any[], search: string) =>
    list.filter((s: any) => {
      if (search && !s.name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

  const filteredOrgs = useMemo(() => filterList(orgs, orgSearch), [orgs, orgSearch]);
  const filteredPeople = useMemo(() => filterList(people, indSearch), [people, indSearch]);

  const orgTotalPages = Math.ceil(filteredOrgs.length / ITEMS_PER_PAGE);
  const indTotalPages = Math.ceil(filteredPeople.length / ITEMS_PER_PAGE);
  const paginatedOrgs = filteredOrgs.slice((orgPage - 1) * ITEMS_PER_PAGE, orgPage * ITEMS_PER_PAGE);
  const paginatedPeople = filteredPeople.slice((indPage - 1) * ITEMS_PER_PAGE, indPage * ITEMS_PER_PAGE);

  const totalDonations = [...orgs, ...people].reduce((s, p) => s + (p.donationAmount || 0), 0);
  const activeCount = [...orgs, ...people].filter(s => s.isActive !== false).length;

  // Chart data: top 5 by donation
  const chartData = useMemo(() => {
    const all = [...orgs.map(o => ({ ...o, _type: 'org' })), ...people.map(p => ({ ...p, _type: 'ind' }))]
      .filter(s => s.donationAmount > 0)
      .sort((a, b) => (b.donationAmount || 0) - (a.donationAmount || 0))
      .slice(0, 5);
    return all.map(s => ({
      name: s.name?.length > 12 ? s.name.slice(0, 12) + '...' : s.name || 'Unknown',
      donation: s.donationAmount || 0,
    }));
  }, [orgs, people]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sponsor Management</h1>
            <p className="text-blue-100 text-sm mt-1">{orgs.length} organizations, {people.length} individuals</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => openForm('organization')} className="bg-white/20 hover:bg-white/30 text-white border border-white/30">
              <Building2 className="w-4 h-4 mr-1.5" /> Add Organization
            </Button>
            <Button onClick={() => openForm('individual')} className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg">
              <UserCircle className="w-4 h-4 mr-1.5" /> Add Individual
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Organizations', value: orgs.length, icon: Building2, color: 'text-blue-600' },
          { label: 'Individuals', value: people.length, icon: UserCircle, color: 'text-purple-600' },
          { label: 'Active', value: activeCount, icon: ShieldCheck, color: 'text-green-600' },
          { label: 'Total Donations', value: `NRs. ${totalDonations.toLocaleString()}`, icon: CircleDollarSign, color: 'text-orange-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-3 flex items-center gap-3 shadow-sm">
            <div className={`w-9 h-9 rounded-lg bg-opacity-10 flex items-center justify-center shrink-0 ${s.color.replace('text-', 'bg-')}/10`}>
              <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-500">{s.label}</p>
              <p className="text-sm font-bold text-gray-900 truncate">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <CircleDollarSign className="w-4 h-4 text-green-600" /> Top Donors
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => `NRs. ${v.toLocaleString()}`} />
              <Bar dataKey="donation" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Orgs + Individuals columns */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Organizations */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-4 border-b flex flex-wrap items-center gap-2">
            <h2 className="font-semibold flex items-center gap-2 mr-auto">
              <Building2 className="w-4 h-4 text-blue-600" /> Organizations
            </h2>
            <div className="relative w-36">
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search..." value={orgSearch} onChange={e => { setOrgSearch(e.target.value); setOrgPage(1); setSelectedOrgIds([]); }} className="pl-7 h-7 text-xs" />
            </div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setOrgSort(s => s === 'donation' ? 'default' : 'donation')}>
              <ArrowUpDown className={`w-3.5 h-3.5 ${orgSort === 'donation' ? 'text-blue-600' : 'text-gray-400'}`} />
            </Button>
          </div>
          {selectedOrgIds.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b text-xs">
              <span className="text-blue-700 font-medium">{selectedOrgIds.length} selected</span>
              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => handleBulkToggle('organization', true)}>Activate</Button>
              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => handleBulkToggle('organization', false)}>Deactivate</Button>
              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 ml-auto" onClick={() => setSelectedOrgIds([])}>Clear</Button>
            </div>
          )}
          <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-sm text-gray-400">Loading...</div>
            ) : paginatedOrgs.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400">No organizations</div>
            ) : paginatedOrgs.map((sponsor, i) => (
              <motion.div key={sponsor._id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-3 p-3 rounded-lg border hover:shadow-sm transition-all group ${selectedOrgIds.includes(sponsor._id) ? 'bg-blue-50/50 border-blue-200' : 'hover:border-blue-200'}`}>
                <Checkbox checked={selectedOrgIds.includes(sponsor._id)} onCheckedChange={() =>
                  setSelectedOrgIds(p => p.includes(sponsor._id) ? p.filter(x => x !== sponsor._id) : [...p, sponsor._id])} />
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center border cursor-pointer"
                  onClick={() => { const u = getImageUrl(sponsor.logo); if (u) setLightboxImg(u); }}>
                  {getImageUrl(sponsor.logo) ? <img src={getImageUrl(sponsor.logo)} alt="" className="w-full h-full object-cover" />
                    : <Building2 className="w-4 h-4 text-gray-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-medium text-sm truncate">{sponsor.name}</p>
                    <Badge className={`text-[10px] ${sponsor.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {sponsor.isActive !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {sponsor.bio && <p className="text-xs text-gray-500 truncate">{sponsor.bio}</p>}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="font-medium text-green-600">NRs. {Number(sponsor.donationAmount || 0).toLocaleString()}</span>
                    <span>·</span>
                    <span>Since {new Date(sponsor.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  </div>
                  {sponsor.website && (
                    <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-500 hover:underline truncate block">
                      {sponsor.website}
                    </a>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openForm('organization', sponsor)}><Pencil className="w-3.5 h-3.5 text-blue-600" /></Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { console.log('Deleting org:', sponsor._id); handleDeleteSponsor('organization', sponsor._id); }}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                </div>
              </motion.div>
            ))}
          </div>
          {orgTotalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t">
              <span className="text-xs text-gray-400">{filteredOrgs.length} total</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={orgPage <= 1} onClick={() => setOrgPage(p => p - 1)}><ChevronLeft className="w-3.5 h-3.5" /></Button>
                {Array.from({ length: orgTotalPages }, (_, i) => i + 1).map(p => (
                  <Button key={p} variant={p === orgPage ? 'default' : 'outline'} size="sm" className="h-7 w-7 p-0 text-xs" onClick={() => setOrgPage(p)}>{p}</Button>
                ))}
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={orgPage >= orgTotalPages} onClick={() => setOrgPage(p => p + 1)}><ChevronRight className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          )}
        </div>

        {/* Individuals */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-4 border-b flex flex-wrap items-center gap-2">
            <h2 className="font-semibold flex items-center gap-2 mr-auto">
              <UserCircle className="w-4 h-4 text-purple-600" /> Individuals
            </h2>
            <div className="relative w-36">
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search..." value={indSearch} onChange={e => { setIndSearch(e.target.value); setIndPage(1); setSelectedIndIds([]); }} className="pl-7 h-7 text-xs" />
            </div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIndSort(s => s === 'donation' ? 'default' : 'donation')}>
              <ArrowUpDown className={`w-3.5 h-3.5 ${indSort === 'donation' ? 'text-purple-600' : 'text-gray-400'}`} />
            </Button>
          </div>
          {selectedIndIds.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border-b text-xs">
              <span className="text-purple-700 font-medium">{selectedIndIds.length} selected</span>
              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => handleBulkToggle('individual', true)}>Activate</Button>
              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => handleBulkToggle('individual', false)}>Deactivate</Button>
              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 ml-auto" onClick={() => setSelectedIndIds([])}>Clear</Button>
            </div>
          )}
          <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-sm text-gray-400">Loading...</div>
            ) : paginatedPeople.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400">No individuals</div>
            ) : paginatedPeople.map((sponsor, i) => (
              <motion.div key={sponsor._id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-3 p-3 rounded-lg border hover:shadow-sm transition-all group ${selectedIndIds.includes(sponsor._id) ? 'bg-purple-50/50 border-purple-200' : 'hover:border-purple-200'}`}>
                <Checkbox checked={selectedIndIds.includes(sponsor._id)} onCheckedChange={() =>
                  setSelectedIndIds(p => p.includes(sponsor._id) ? p.filter(x => x !== sponsor._id) : [...p, sponsor._id])} />
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center border cursor-pointer"
                  onClick={() => { const u = getImageUrl(sponsor.avatar); if (u) setLightboxImg(u); }}>
                  {getImageUrl(sponsor.avatar) ? <img src={getImageUrl(sponsor.avatar)} alt="" className="w-full h-full object-cover" />
                    : <UserCircle className="w-4 h-4 text-gray-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-medium text-sm truncate">{sponsor.name}</p>
                    <Badge className={`text-[10px] ${sponsor.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {sponsor.isActive !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {sponsor.title && <p className="text-xs text-gray-500">{sponsor.title}</p>}
                  {sponsor.bio && <p className="text-xs text-gray-400 truncate">{sponsor.bio}</p>}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="font-medium text-green-600">NRs. {Number(sponsor.donationAmount || 0).toLocaleString()}</span>
                    <span>·</span>
                    <span>Since {new Date(sponsor.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openForm('individual', sponsor)}><Pencil className="w-3.5 h-3.5 text-blue-600" /></Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { console.log('Deleting ind:', sponsor._id); handleDeleteSponsor('individual', sponsor._id); }}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                </div>
              </motion.div>
            ))}
          </div>
          {indTotalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t">
              <span className="text-xs text-gray-400">{filteredPeople.length} total</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={indPage <= 1} onClick={() => setIndPage(p => p - 1)}><ChevronLeft className="w-3.5 h-3.5" /></Button>
                {Array.from({ length: indTotalPages }, (_, i) => i + 1).map(p => (
                  <Button key={p} variant={p === indPage ? 'default' : 'outline'} size="sm" className="h-7 w-7 p-0 text-xs" onClick={() => setIndPage(p)}>{p}</Button>
                ))}
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={indPage >= indTotalPages} onClick={() => setIndPage(p => p + 1)}><ChevronRight className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Team + QR row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-600" /> Team Members
              <Badge variant="outline" className="text-xs font-normal ml-1">{team.length}</Badge>
            </h2>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setTeamOpen(true)}>
              <Users className="w-3.5 h-3.5 mr-1" /> Manage
            </Button>
          </div>
          <div className="p-3">
            {teamLoading ? <div className="text-center py-6 text-sm text-gray-400">Loading...</div>
            : team.length === 0 ? <div className="text-center py-6 text-sm text-gray-400">No team members yet</div>
            : <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {team.slice(0, 6).map((member: any) => (
                  <div key={member._id} className="flex flex-col items-center gap-1.5 p-3 rounded-lg border hover:shadow-sm transition-all">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border">
                      {member.avatar ? <img src={getImageUrl(member.avatar) || ''} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">{member.name?.charAt(0)?.toUpperCase()}</div>}
                    </div>
                    <p className="text-xs font-medium text-center truncate w-full">{member.name}</p>
                    <p className="text-[10px] text-gray-500 text-center truncate w-full">{member.position}</p>
                  </div>
                ))}
              </div>
            }
          </div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-4 border-b flex items-center gap-2">
            <QrCode className="w-4 h-4 text-gray-600" />
            <h2 className="font-semibold">Payment QR Code</h2>
          </div>
          <div className="p-4"><PaymentQRForm /></div>
        </div>
      </div>

      {/* Sponsor Form Dialog */}
      <Dialog open={!!modal} onOpenChange={() => setModal(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modal?.sponsor ? 'Edit' : 'Add'} {modal?.type === 'organization' ? 'Organization' : 'Individual'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Name *</Label>
              <Input value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} required placeholder="Sponsor name" />
            </div>
            {modal?.type === 'individual' && (
              <div className="space-y-1">
                <Label className="text-xs">Title</Label>
                <Input value={formData.title} onChange={e => setFormData(f => ({ ...f, title: e.target.value }))} placeholder="e.g. CEO" />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Bio</Label>
              <Textarea value={formData.bio} onChange={e => setFormData(f => ({ ...f, bio: e.target.value }))} rows={2} placeholder="Short description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Donation (NRs.)</Label>
                <Input type="number" value={formData.donationAmount} onChange={e => setFormData(f => ({ ...f, donationAmount: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Display Order</Label>
                <Input type="number" value={formData.displayOrder} onChange={e => setFormData(f => ({ ...f, displayOrder: Number(e.target.value) }))} placeholder="0" />
              </div>
            </div>
            {modal?.type === 'organization' && (
              <div className="space-y-3 border rounded-lg p-3 bg-gray-50/50">
                <p className="text-xs font-medium text-gray-600">Contact Information</p>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1"><Globe className="w-3 h-3" /> Website</Label>
                  <Input value={formData.website} onChange={e => setFormData(f => ({ ...f, website: e.target.value }))} placeholder="https://example.com" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> Email</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} placeholder="contact@example.com" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</Label>
                  <Input value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} placeholder="+977..." />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">{modal?.type === 'organization' ? 'Logo' : 'Avatar'}</Label>
              <div className="flex items-center gap-3">
                {imagePreview && <img src={imagePreview} alt="" className="w-14 h-14 rounded-lg object-cover border cursor-pointer" onClick={() => setLightboxImg(imagePreview)} />}
                <Input type="file" accept="image/*" onChange={handleFileChange} className="text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={formData.isActive}
                onChange={e => setFormData(f => ({ ...f, isActive: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <Label htmlFor="isActive" className="cursor-pointer text-sm">Active</Label>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t">
              <Button variant="outline" type="button" onClick={() => setModal(null)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : modal?.sponsor ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Team Members Dialog */}
      <Dialog open={teamOpen} onOpenChange={setTeamOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Team Members</DialogTitle>
            <DialogDescription>Manage your UPPL team</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {team.map((member: any) => (
              <div key={member._id} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 shrink-0 border">
                  {member.avatar ? <img src={getImageUrl(member.avatar) || ''} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">{member.name?.charAt(0)?.toUpperCase()}</div>}
                </div>
                <div className="flex-1"><p className="font-medium text-sm">{member.name}</p><p className="text-xs text-gray-500">{member.position}</p></div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setMemberForm(member)}><Pencil className="w-3.5 h-3.5 text-blue-600" /></Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleDeleteMember(member._id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                </div>
              </div>
            ))}
            <Button onClick={() => setMemberForm({} as any)} className="w-full" variant="outline"><Plus className="w-4 h-4 mr-1.5" /> Add Member</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Member Form Dialog */}
      <Dialog open={!!memberForm} onOpenChange={() => setMemberForm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{memberForm?._id ? 'Edit' : 'Add'} Member</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveMember} className="space-y-4">
            <div className="space-y-1"><Label>Name *</Label><Input name="name" defaultValue={memberForm?.name} required placeholder="Full name" /></div>
            <div className="space-y-1"><Label>Position *</Label><Input name="position" defaultValue={memberForm?.position} required placeholder="e.g. Team Manager" /></div>
            <div className="space-y-1">
              <Label>Photo</Label>
              <Input type="file" name="teamMember" accept="image/*" className="text-sm" />
              {memberForm?.avatar && <img src={getImageUrl(memberForm.avatar) || ''} alt="" className="w-16 h-16 rounded-lg object-cover border mt-1" />}
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t">
              <Button variant="outline" type="button" onClick={() => setMemberForm(null)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
          <button className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white" onClick={() => setLightboxImg(null)}>
            <X className="w-5 h-5" />
          </button>
          <img src={lightboxImg} alt="" className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default SponsorManagement;
