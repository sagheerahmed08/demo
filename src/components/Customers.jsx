
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { User, Phone, ShoppingBag, Edit, Search, Hash, Mail, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useShopSettings } from '@/contexts/ShopSettingsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


const CustomerEditForm = ({ customer, onClose, onSave }) => {
  const [formData, setFormData] = useState({ name: customer.name, phone: customer.phone, email: customer.email || '' });
  const { toast } = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({ title: "Validation Error", description: "Name and Phone cannot be empty.", variant: "destructive" });
      return;
    }
    onSave(customer.id, formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
        <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email (Optional)</label>
        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">Save Changes</Button>
      </DialogFooter>
    </form>
  );
};


const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const { toast } = useToast();
  const { settings } = useShopSettings();
  const navigate = useNavigate();
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);


  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          sales ( count )
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      
      const customersWithSalesCount = data.map(customer => ({
        ...customer,
        sales_count: customer.sales[0]?.count || 0
      }));
      setCustomers(customersWithSalesCount);

    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({ title: 'Error', description: 'Could not fetch customers.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearchInvoice = async () => {
    if (!invoiceSearchTerm.trim()) {
      toast({ title: 'Info', description: 'Please enter an invoice number to search.', variant: 'default' });
      return;
    }
    navigate(`/sales/invoice/${invoiceSearchTerm.trim()}`);
  };
  
  const handleSaveCustomer = async (customerId, updatedData) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ 
            name: updatedData.name, 
            phone: updatedData.phone, 
            email: updatedData.email,
            updated_at: new Date().toISOString() 
        })
        .eq('id', customerId);
      if (error) throw error;
      toast({ title: "Success", description: "Customer details updated." });
      setEditingCustomer(null);
      fetchCustomers(); 
    } catch (error) {
      console.error("Error updating customer:", error);
      toast({ title: "Error", description: "Could not update customer details. " + error.message, variant: "destructive" });
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    try {
      const { data: sales, error: checkError } = await supabase
        .from('sales')
        .select('id')
        .eq('customer_id', customerId)
        .limit(1);

      if (checkError) throw checkError;

      if (sales && sales.length > 0) {
        toast({
          title: "Deletion Prevented",
          description: "This customer has existing sales records and cannot be deleted.",
          variant: "destructive",
          duration: 7000,
        });
        setCustomerToDelete(null);
        return;
      }

      const { error: deleteError } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (deleteError) throw deleteError;
      toast({ title: "Success", description: "Customer deleted successfully." });
      fetchCustomers();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete customer: " + error.message, variant: "destructive" });
    }
    setCustomerToDelete(null);
  };


  const filteredCustomers = customers.filter(customer =>
    (customer.name && customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.phone && customer.phone.includes(searchTerm)) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="text-center py-10">Loading customers...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Customers</h1>
        <div className="flex gap-2 items-center w-full sm:w-auto">
           <Input 
            type="text"
            placeholder="Search invoice..."
            value={invoiceSearchTerm}
            onChange={(e) => setInvoiceSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={handleSearchInvoice} variant="outline" size="icon"><Hash className="w-4 h-4"/></Button>
        </div>
      </div>
      <Input 
        type="text"
        placeholder="Search customers by name, phone, or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md"
      />
      {filteredCustomers.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No customers found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map(customer => (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`p-6 rounded-xl shadow-lg transition-all hover:shadow-xl relative ${settings.darkMode ? 'bg-gray-800 neumorphism-dark' : 'bg-white neumorphism'}`}
            >
              <div className="absolute top-2 right-2 flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => { e.stopPropagation(); setEditingCustomer(customer); }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500 hover:bg-red-100 dark:hover:bg-red-700/30"
                      onClick={(e) => { e.stopPropagation(); setCustomerToDelete(customer); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  {customerToDelete && customerToDelete.id === customer.id && (
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Customer "{customerToDelete.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. Are you sure you want to delete this customer? This is only possible if the customer has no associated sales.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteCustomer(customerToDelete.id)} className="bg-red-600 hover:bg-red-700">
                          Yes, Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  )}
                </AlertDialog>
              </div>
              <Link to={`/customers/${customer.id}`} className="block">
                <div className="flex items-center space-x-3 mb-3 pr-16"> {/* Added pr-16 for button space */}
                  <User className={`w-6 h-6 ${settings.darkMode ? 'text-primary-foreground' : 'text-primary'}`} />
                  <h2 className="text-xl font-semibold truncate">{customer.name}</h2>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <Phone className={`w-4 h-4 ${settings.darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className={`w-4 h-4 ${settings.darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className={`w-4 h-4 ${settings.darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    <span>{customer.sales_count} Purchase{customer.sales_count === 1 ? '' : 's'}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
      {editingCustomer && (
        <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>
                Update the details for {editingCustomer.name}. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <CustomerEditForm 
              customer={editingCustomer} 
              onClose={() => setEditingCustomer(null)}
              onSave={handleSaveCustomer}
            />
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
};

export default Customers;
