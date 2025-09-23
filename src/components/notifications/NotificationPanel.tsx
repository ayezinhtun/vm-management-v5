import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, AlertTriangle, Calendar, CheckCircle, Server, Shield, FileText } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useSupabaseDataStore as useDataStore } from '../../hooks/useSupabaseDataStore';
import { showToast } from '../ui/Toast';

interface Notification {
  id: string;
  type: 'vm_password_due' | 'gp_password_due' | 'contract_expiring' | 'vm_password_overdue' | 'gp_password_overdue' | 'contract_overdue';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  created_at: string;
  read: boolean;
  entity_id: string;
  entity_name: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { vms, contracts, gpAccounts, customers } = useDataStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const generateNotifications = () => {
    const today = new Date();
    const generatedNotifications: Notification[] = [];

    // VM Password Due Soon (within 7 days)
    vms.forEach(vm => {
      const dueDate = new Date(vm.next_password_due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 7 && daysUntilDue > 0) {
        generatedNotifications.push({
          id: `vm_due_${vm.id}`,
          type: 'vm_password_due',
          title: 'VM Password Due Soon',
          message: `VM "${vm.vm_name}" password expires in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
          priority: daysUntilDue <= 3 ? 'high' : 'medium',
          created_at: new Date().toISOString(),
          read: false,
          entity_id: vm.id,
          entity_name: vm.vm_name
        });
      }
    });

    // VM Password Overdue
    vms.forEach(vm => {
      const dueDate = new Date(vm.next_password_due_date);
      if (dueDate < today) {
        const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        generatedNotifications.push({
          id: `vm_overdue_${vm.id}`,
          type: 'vm_password_overdue',
          title: 'VM Password OVERDUE',
          message: `VM "${vm.vm_name}" password is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
          priority: 'high',
          created_at: new Date().toISOString(),
          read: false,
          entity_id: vm.id,
          entity_name: vm.vm_name
        });
      }
    });

    // GP Password Due Soon (within 7 days)
    gpAccounts.forEach(gp => {
      const dueDate = new Date(gp.next_password_due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 7 && daysUntilDue > 0) {
        generatedNotifications.push({
          id: `gp_due_${gp.id}`,
          type: 'gp_password_due',
          title: 'GP Password Due Soon',
          message: `GP Account "${gp.gp_username}" password expires in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
          priority: daysUntilDue <= 3 ? 'high' : 'medium',
          created_at: new Date().toISOString(),
          read: false,
          entity_id: gp.id,
          entity_name: gp.gp_username
        });
      }
    });

    // GP Password Overdue
    gpAccounts.forEach(gp => {
      const dueDate = new Date(gp.next_password_due_date);
      if (dueDate < today) {
        const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        generatedNotifications.push({
          id: `gp_overdue_${gp.id}`,
          type: 'gp_password_overdue',
          title: 'GP Password OVERDUE',
          message: `GP Account "${gp.gp_username}" password is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
          priority: 'high',
          created_at: new Date().toISOString(),
          read: false,
          entity_id: gp.id,
          entity_name: gp.gp_username
        });
      }
    });

    // Contract Expiring Soon (within 30 days)
    contracts.forEach(contract => {
      const endDate = new Date(contract.service_end_date);
      const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0 && contract.status === 'Active') {
        generatedNotifications.push({
          id: `contract_expiring_${contract.id}`,
          type: 'contract_expiring',
          title: 'Contract Expiring Soon',
          message: `Contract "${contract.contract_number}" expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`,
          priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
          created_at: new Date().toISOString(),
          read: false,
          entity_id: contract.id,
          entity_name: contract.contract_number
        });
      }
    });

    // Contract Overdue
    contracts.forEach(contract => {
      const endDate = new Date(contract.service_end_date);
      if (endDate < today && contract.status === 'Active') {
        const daysOverdue = Math.ceil((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
        generatedNotifications.push({
          id: `contract_overdue_${contract.id}`,
          type: 'contract_overdue',
          title: 'Contract OVERDUE',
          message: `Contract "${contract.contract_number}" expired ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} ago`,
          priority: 'high',
          created_at: new Date().toISOString(),
          read: false,
          entity_id: contract.id,
          entity_name: contract.contract_number
        });
      }
    });

    // Sort by priority and date
    generatedNotifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return generatedNotifications;
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      const notifications = generateNotifications();
      setNotifications(notifications);
    } catch (error) {
      showToast.error('Failed to load notifications');
      console.error('Load notifications error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, vms, contracts, gpAccounts]);

  const markAsRead = (notificationId: string) => {
    setNotifications(notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
    showToast.success('All notifications marked as read');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'vm_password_due':
      case 'vm_password_overdue':
        return <Server className="w-5 h-5 text-blue-600" />;
      case 'gp_password_due':
      case 'gp_password_overdue':
        return <Shield className="w-5 h-5 text-purple-600" />;
      case 'contract_expiring':
      case 'contract_overdue':
        return <FileText className="w-5 h-5 text-orange-600" />;
      default: 
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: string, type: string) => {
    if (type.includes('overdue')) {
      return 'border-red-300 bg-red-100';
    }
    
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-amber-200 bg-amber-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex min-h-screen items-start justify-end p-4">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="relative bg-white rounded-lg shadow-xl w-full max-w-md h-full max-h-screen overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-sm text-gray-600">{unreadCount} unread</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={markAllAsRead}>
                      Mark all read
                    </Button>
                  )}
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto h-full pb-16">
                {loading ? (
                  <div className="p-4 space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg border-l-4 cursor-pointer transition-opacity ${
                          getPriorityColor(notification.priority, notification.type)
                        } ${notification.read ? 'opacity-60' : ''}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          {getIcon(notification.type)}
                          <div className="flex-1">
                            <h4 className={`font-medium ${
                              notification.type.includes('overdue') ? 'text-red-900' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className={`w-2 h-2 rounded-full ${
                              notification.priority === 'high' ? 'bg-red-600' :
                              notification.priority === 'medium' ? 'bg-amber-600' :
                              'bg-blue-600'
                            }`}></div>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {notifications.length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No notifications</p>
                        <p className="text-sm text-gray-400">All systems are up to date</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};