import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useAuth } from '../hooks/useAuth';

export function Layout() {
    const { user, isSubscribed } = useAuth();
    const [showAuthModal, setShowAuthModal] = React.useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = React.useState(false);
    const [showPreferences, setShowPreferences] = React.useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <Navbar
                    user={user}
                    isSubscribed={isSubscribed}
                    onShowAuthModal={() => setShowAuthModal(true)}
                    onShowSubscriptionModal={() => setShowSubscriptionModal(true)}
                    onShowPreferences={() => setShowPreferences(true)}
                />
            </div>
            <Outlet />
        </div>
    );
}