import React, { useEffect, useState } from 'react';
import { API_BASE, BASE_URL } from '@/config';
import {
  Users,
  Search,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  CheckCircle,
  XCircle,
  User as UserIcon,
  ArrowLeft,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import axios from 'axios';

const BASE_URL = BASE_URL;

const UsersManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [users, setUsers] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalUsers, setTotalUsers] = useState(0);
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / limit) || 1;

  const usersToDisplay = filteredUsers.slice((page - 1) * limit, page * limit);




  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('pplt20_token');
        const res = await axios.get(`${BASE_URL}/api/admin/users?limit=9999`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fetchedUsers = res.data.users || [];
        // console.log('Fetched users:', fetchedUsers);
        fetchedUsers.forEach((user: any) => {
          // console.log('User:', user.name, 'Profile Image:', user.profileImage);
        });      

        const formatted = fetchedUsers.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
          verified: user.verified || false,
          joinDate:
            user.joinDate && !isNaN(new Date(user.joinDate).getTime())
              ? new Date(user.joinDate).toISOString().split('T')[0]
              : 'N/A',
          phone: user.phone || 'N/A',
          profileImage: user.profileImage || null,   // ✅ store raw path only
          playerCode: user.playerCode || '',
        })); 

        setUsers(formatted);
        setTotalUsers(formatted.length); // total is now length of array
      } catch (error) {
        console.error('Failed to load users', error);
      }
    };
    fetchUsers();
  }, []);



  const handleDeleteUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('pplt20_token');
      await axios.delete(`${BASE_URL}/api/admin/delete-user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter((user) => user.id !== userId));
      toast({ title: 'User Deleted' });
    } catch (err) {
      console.error('Error deleting user:', err);
      toast({ title: 'Delete Failed', description: 'Could not delete user' });
    }
  };

  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('pplt20_token');

      let endpoint = '';
      if (currentStatus) {
        // if already verified → reject
        endpoint = `${BASE_URL}/api/admin/reject-player/${userId}`;
      } else {
        // if pending → verify
        endpoint = `${BASE_URL}/api/admin/verify-player/${userId}`;
      }

      await axios.patch(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // update UI state
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, verified: !currentStatus } : user
        )
      );

      toast({
        title: 'Verification Updated',
        description: `Player is now ${currentStatus ? 'Rejected' : 'Verified'}`,
      });
    } catch (err) {
      console.error('Error toggling verification:', err);
      toast({
        title: 'Error',
        description: 'Failed to toggle verification',
        variant: 'destructive',
      });
    }
  };


  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      const token = localStorage.getItem('pplt20_token');

      const formData = new FormData();
      formData.append('name', editingUser.name || '');
      formData.append('email', editingUser.email || '');
      formData.append('role', editingUser.role || 'user');
      formData.append('phone', editingUser.phone || '');
      formData.append('position', editingUser.position || '');
      formData.append('battingStyle', editingUser.battingStyle || '');
      formData.append('bowlingStyle', editingUser.bowlingStyle || '');
      formData.append('bio', editingUser.bio || '');
      formData.append('dateOfBirth', editingUser.dateOfBirth || '');

      if (editingUser.profileImage instanceof File) {
        formData.append('profileImage', editingUser.profileImage);
      }

      if (Array.isArray(editingUser.documents)) {
        editingUser.documents.forEach((file: any) => {
          if (file instanceof File) {
            formData.append('documents', file);
          }
        });
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      if (editingUser?.id) {
        await axios.patch(
          `${BASE_URL}/api/admin/users/${editingUser.id}`,
          formData,
          config
        );
        toast({ title: 'User Updated' });
      } else {
        await axios.post(`${BASE_URL}/api/admin/users`, formData, config);
        toast({ title: 'User Created' });
      }

      setIsDialogOpen(false);
      setEditingUser(null);
      setPage(1);
    } catch (error) {
      console.error('Save user error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getProfileImageUrl = (path: string | null) => {
    const BASE_URL = BASE_URL;
    if (!path) {
      return `${BASE_URL}/uploads/default-avatar.png`;
    }

    if (path.startsWith('http')) {
      return path;
    }

    // 🧹 Fix cases with double or triple /uploads
    let cleanPath = path
      .replace(/\/+/g, '/')                 // collapse multiple slashes
      .replace(/^\/uploads\/uploads\//, '/uploads/')  // remove duplicate uploads prefix
      .replace(/^uploads\//, '/uploads/');  // ensure leading slash

    // Ensure leading slash
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }

    const finalUrl = `${BASE_URL}${cleanPath}`;
    console.log("🖼 Final image URL:", finalUrl);
    return finalUrl;
  };  

  useEffect(() => {
    setPage(1);
  }, [searchTerm,filterRole]);


  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      {/* Responsive grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
        {/* Sidebar */}
        <aside className="bg-white shadow-md rounded-xl p-3 sm:p-4 lg:col-span-3">
          <Button
              variant="outline"
              className="flex items-center gap-2 h-9 sm:h-10 px-3 sm:px-4 text-sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-6 w-6" /> Back
            </Button>
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-4 mt-3 sm:mt-10">
            Users Management
          </h2>
          <nav className="space-y-2 sm:space-y-3">
            <Button
              variant={filterRole === 'all' ? 'default' : 'outline'}
              className="w-full justify-start text-sm sm:text-base"
              onClick={() => setFilterRole('all')}
            >
              <Users className="h-4 w-4 mr-2" /> All Users
            </Button>
            <Button
              variant={filterRole === 'admin' ? 'default' : 'outline'}
              className="w-full justify-start text-sm sm:text-base"
              onClick={() => setFilterRole('admin')}
            >
              <Shield className="h-4 w-4 mr-2" /> Admins
            </Button>
            <Button
              variant={filterRole === 'player' ? 'default' : 'outline'}
              className="w-full justify-start text-sm sm:text-base"
              onClick={() => setFilterRole('player')}
            >
              <UserIcon className="h-4 w-4 mr-2" /> Players
            </Button>
            <Button
              variant={filterRole === 'user' ? 'default' : 'outline'}
              className="w-full justify-start text-sm sm:text-base"
              onClick={() => setFilterRole('user')}
            >
              <UserIcon className="h-4 w-4 mr-2" /> Users
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-9 space-y-1">
          {/* Back + Search */}
          {/* Search Bar + Add User in a Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 sm:h-10 pl-9 text-sm rounded-full shadow-sm border"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Add User Button */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() =>
                    setEditingUser({
                      name: '',
                      email: '',
                      role: 'user',
                      verified: false,
                    })
                  }
                  className="w-full sm:w-auto"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>


          {/* Header + Add User */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                {/* <Button
                  onClick={() =>
                    setEditingUser({
                      name: '',
                      email: '',
                      role: 'user',
                      verified: false,
                    })
                  }
                  className="w-full sm:w-auto"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button> */}
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingUser?.id ? 'Edit User' : 'Add New User'}
                  </DialogTitle>
                </DialogHeader>

                {/* Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={editingUser?.name || ''}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editingUser?.email || ''}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, email: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={editingUser?.phone || ''}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, phone: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={editingUser?.role || 'user'}
                      onValueChange={(value) =>
                        setEditingUser({ ...editingUser, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="player">Player</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Button onClick={handleSaveUser} className="w-full">
                      {editingUser?.id ? 'Update User' : 'Create User'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Table */}
          <Card>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="w-full border-collapse">
                <TableHeader>
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead className="text-left font-semibold text-slate-700">User</TableHead>
                    <TableHead className="text-left font-semibold text-slate-700">Email</TableHead>
                    <TableHead className="text-left font-semibold text-slate-700">Role</TableHead>
                    <TableHead className="text-left font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="text-left font-semibold text-slate-700">Join Date</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersToDisplay.map((user,index) => (
                    <TableRow key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <TableCell className="text-sm text-slate-700 font-medium text-center">
                      {(page - 1) * limit + index + 1}
                    </TableCell>
                      <TableCell className="flex items-center space-x-3 py-4">
                        <img
                          src={getProfileImageUrl(user.profileImage) || '/default-avatar.png'}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium text-slate-900">{user.name}</div>
                          {user.role === 'player' && (
                            <div className="text-xs text-slate-500 mt-0.5">Code: {user.playerCode}</div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-sm text-slate-700">{user.email}</TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            user.role === 'admin'
                              ? 'destructive'
                              : user.role === 'player'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {user.role === 'player' ? (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.verified
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {user.verified ? 'Verified' : 'Pending'}
                          </span>
                        ) : (
                          <Badge variant="outline" className="text-xs">N/A</Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-sm text-slate-600">{user.joinDate}</TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            className="hover:bg-slate-200"
                          >
                            <Edit className="h-4 w-4 text-slate-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleVerification(user.id)}
                            className="hover:bg-slate-200"
                          >
                            {user.verified ? (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                >
                  Previous
                </Button>
                <span className="text-xs sm:text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages))
                  }
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default UsersManagement;
