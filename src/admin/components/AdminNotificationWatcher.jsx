import React, { useEffect, useRef } from 'react';
import { useAdminToast } from '../context/AdminToastContext';

export default function AdminNotificationWatcher() {
    const { showToast } = useAdminToast();
    const lastOrdersCount = useRef(null);
    const lastContactsCount = useRef(null);

    useEffect(() => {
        const check = () => {
            try {
                const settings = JSON.parse(localStorage.getItem('nextclass_settings') || '{}');
                
                // Check Orders
                if (settings.notifOrders !== false) {
                    const orders = JSON.parse(localStorage.getItem('nextclass_orders') || '[]');
                    if (lastOrdersCount.current !== null && orders.length > lastOrdersCount.current) {
                        showToast(`הזמנה חדשה התקבלה! (#${orders[orders.length-1].id})`, 'success');
                        // Play a subtle sound if possible, but let's stick to visual for now
                    }
                    lastOrdersCount.current = orders.length;
                }

                // Check Contacts
                if (settings.notifContacts === true) {
                    const contacts = JSON.parse(localStorage.getItem('nextclass_contacts') || '[]');
                    if (lastContactsCount.current !== null && contacts.length > lastContactsCount.current) {
                        showToast(`פנייה חדשה מלקוח: ${contacts[contacts.length-1].name}`, 'info');
                    }
                    lastContactsCount.current = contacts.length;
                }
            } catch (e) {}
        };

        const interval = setInterval(check, 5000); // Check every 5 seconds
        check(); // Initial check

        return () => clearInterval(interval);
    }, [showToast]);

    return null; // This component is invisible
}
