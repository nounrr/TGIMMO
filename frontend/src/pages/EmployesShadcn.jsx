import { useEffect, useMemo, useState } from 'react';
import { useGetUsersQuery, useDeleteUserMutation, useCreateUserMutation, useUpdateUserMutation } from '../features/users/usersApi';
import { useGetRolesQuery } from '../features/roles/rolesApi';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
} from '@tanstack/react-table';
import useAuthz from '../hooks/useAuthz';
import { PERMS } from '../utils/permissionKeys';
import { useToast } from '@/hooks/use-toast';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Users, Loader2 } from 'lucide-react';
import { PaginationControl } from '@/components/PaginationControl';

export default function EmployesShadcn() {
  const { can } = useAuthz();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    fonction: '',
    service: '',
    telephone_interne: '',
    statut: 'actif',
    photo: '',
    roles: [],
  });

  const queryParams = useMemo(() => {
    const sort = Array.isArray(sorting) && sorting.length > 0 ? sorting[0] : null;
    const sortBy = sort?.id ? sort.id : undefined;
    const sortDir = sort?.desc ? 'desc' : 'asc';
    return {
      page: pagination.pageIndex + 1,
      per_page: pagination.pageSize,
      q: searchTerm || undefined,
      role: selectedRole !== 'all' ? selectedRole : undefined,
      withRoles: true,
      sort_by: sortBy,
      sort_dir: sort ? sortDir : undefined,
    };
  }, [pagination, searchTerm, selectedRole, sorting]);

  const { data: usersResp, isLoading, error } = useGetUsersQuery(queryParams);
  const { data: rolesResp } = useGetRolesQuery({ per_page: 100 });
  const roles = useMemo(() => rolesResp?.data || [], [rolesResp?.data]);

  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const users = useMemo(() => usersResp?.data ?? [], [usersResp?.data]);

  // Reset to first page when search or role filter changes
  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [searchTerm, selectedRole]);

  // Handlers
  const handleAdd = () => {
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      fonction: '',
      service: '',
      telephone_interne: '',
      statut: 'actif',
      photo: '',
      roles: [],
    });
    setShowFormModal(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      fonction: user.fonction || '',
      service: user.service || '',
      telephone_interne: user.telephone_interne || '',
      statut: user.statut || 'actif',
      photo: user.photo || user.photo_url || '',
      roles: user.roles?.map(r => r.id) || [],
    });
    setShowFormModal(true);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(selectedUser.id).unwrap();
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la suppression.",
        variant: "destructive",
      });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validation frontend : Rôle obligatoire
    if (formData.roles.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un rôle pour l'utilisateur.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        ...formData,
        role: formData.roles.length > 0 ? formData.roles[0] : null,
      };
      delete payload.roles;
      
      if (!selectedUser) {
        // Create mode
      } else {
        delete payload.password;
        if (!formData.password) {
          delete payload.password;
        }
      }

      if (selectedUser) {
        await updateUser({ id: selectedUser.id, ...payload }).unwrap();
      } else {
        await createUser(payload).unwrap();
      }
      setShowFormModal(false);
      setSelectedUser(null);
    } catch (err) {
      toast({
        title: "Erreur",
        description: err?.data?.message || "Une erreur s'est produite lors de l'enregistrement.",
        variant: "destructive",
      });
    }
  };

  const columns = useMemo(() => [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Employé',
      cell: ({ row }) => {
        const user = row.original;
        const displayName = user.name || user.email || '-';
        return (
          <div>
            <div className="font-semibold text-slate-900">{displayName}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'telephone_interne',
      header: 'Téléphone',
      cell: ({ row }) => <span className="text-slate-700">{row.original?.telephone_interne || '-'}</span>,
    },
    {
      accessorKey: 'fonction',
      header: 'Fonction',
      cell: ({ row }) => <span className="text-slate-700">{row.original?.fonction || '-'}</span>,
    },
    {
      accessorKey: 'roles',
      header: 'Rôles',
      cell: ({ row }) => {
        const user = row.original;
        const userRoles = user.roles || [];
        const roleColors = [
          'bg-blue-100 text-blue-800 hover:bg-blue-100',
          'bg-green-100 text-green-800 hover:bg-green-100',
          'bg-purple-100 text-purple-800 hover:bg-purple-100',
          'bg-orange-100 text-orange-800 hover:bg-orange-100',
          'bg-pink-100 text-pink-800 hover:bg-pink-100',
        ];
        return (
          <div className="flex gap-1 flex-wrap">
            {userRoles.length > 0 ? (
              userRoles.map((role, index) => (
                <Badge key={role.id} className={roleColors[index % roleColors.length]}>
                  {role.name}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">-</span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex gap-2">
            {can(PERMS.users.update) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(user)}
                className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {can(PERMS.users.delete) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteClick(user)}
                className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ], [can]);

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: usersResp?.last_page ?? -1,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: { sorting, pagination },
  });

  const totalPages = usersResp?.last_page ?? table?.getPageCount?.() ?? 1;

  return (
    <div className="w-full p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Employés
          </h1>
          <p className="text-muted-foreground mt-1">Gestion des utilisateurs et de leurs rôles</p>
        </div>
        {can(PERMS.users.create) && (
          <Button onClick={handleAdd} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Nouvel employé
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Filtres
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div>
              <Label htmlFor="search" className="text-sm font-medium mb-1.5 block text-left">
                Recherche
              </Label>
              <Input
                id="search"
                placeholder="Rechercher par nom, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="role" className="text-sm font-medium mb-1.5 block text-left">Rôle</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Tous les rôles" />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.name}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Chargement des employés...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="text-destructive mb-4">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-destructive font-semibold">Erreur lors du chargement des données</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-primary/10 p-6 mb-4">
                <Users className="h-12 w-12 text-primary/50" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Aucun employé trouvé</h3>
              <p className="text-muted-foreground">Commencez par ajouter un nouvel employé</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border-0">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => (
                      <TableRow key={headerGroup.id} className="bg-slate-50">
                        {headerGroup.headers.map(header => (
                          <TableHead key={header.id}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map(row => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <PaginationControl
                  currentPage={pagination.pageIndex + 1}
                  lastPage={totalPages || 1}
                  perPage={pagination.pageSize}
                  onPageChange={(p) => setPagination(prev => ({ ...prev, pageIndex: p - 1 }))}
                  onPerPageChange={(pp) => setPagination(prev => ({ ...prev, pageSize: pp, pageIndex: 0 }))}
                  total={usersResp?.total || 0}
                  from={usersResp?.from || 0}
                  to={usersResp?.to || 0}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>{selectedUser ? 'Modifier l\'employé' : 'Nouvel employé'}</DialogTitle>
              <DialogDescription>
                {selectedUser ? 'Modifiez les informations de l\'employé' : 'Ajoutez un nouvel employé au système'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="photo">Photo (URL)</Label>
                  <Input
                    id="photo"
                    placeholder="https://..."
                    value={formData.photo}
                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                  />
                </div>
                {formData.photo && (
                  <div className="flex items-end">
                    <img src={formData.photo} alt="aperçu" className="h-16 w-16 rounded object-cover border" onError={(e)=>{e.currentTarget.style.display='none'}} />
                  </div>
                )}
              </div>

              {!selectedUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!selectedUser}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fonction">Fonction</Label>
                  <Input
                    id="fonction"
                    value={formData.fonction}
                    onChange={(e) => setFormData({ ...formData, fonction: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service">Service</Label>
                  <Input
                    id="service"
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone interne</Label>
                  <Input
                    id="telephone"
                    value={formData.telephone_interne}
                    onChange={(e) => setFormData({ ...formData, telephone_interne: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statut">Statut</Label>
                  <Select value={formData.statut} onValueChange={(value) => setFormData({ ...formData, statut: value })}>
                    <SelectTrigger id="statut">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="actif">Actif</SelectItem>
                      <SelectItem value="inactif">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roles">Rôles *</Label>
                <Select 
                  value={formData.roles.length > 0 ? formData.roles[0].toString() : ""} 
                  onValueChange={(value) => setFormData({ ...formData, roles: value ? [parseInt(value)] : [] })}
                >
                  <SelectTrigger id="roles">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setShowFormModal(false)} className="w-full sm:w-1/2">
                Annuler
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating} className="w-full sm:w-1/2">
                {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedUser ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'employé</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{selectedUser?.name || selectedUser?.email}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
