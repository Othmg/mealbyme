import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Settings, BookmarkPlus, Lock, LogOut, UserCircle2, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NavbarProps {
  user: any;
  isSubscribed: boolean;
  onShowAuthModal: () => void;
  onShowSubscriptionModal: () => void;
  onShowPreferences: () => void;
}

export function Navbar({
  user,
  isSubscribed,
  onShowAuthModal,
  onShowSubscriptionModal,
  onShowPreferences
}: NavbarProps) {
  const navigate = useNavigate();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="text-sm text-gray-600">
        {/* Left side empty for balance */}
      </div>
      <div className="flex items-center gap-2">
        {user ? (
          <div className="flex items-center gap-2">
            {isSubscribed ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/meal-planner')}
                  className="text-[#FF6B6B] hover:text-[#FF5555] flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg shadow-sm"
                >
                  <Calendar className="w-5 h-5" />
                  <span className="hidden sm:inline">Meal Planner</span>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                    className="text-gray-600 hover:text-gray-800 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg shadow-sm"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="hidden sm:inline">Settings</span>
                  </button>
                  
                  {showSettingsMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                      <button
                        onClick={() => {
                          setShowSettingsMenu(false);
                          navigate('/saved-recipes');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <BookmarkPlus className="w-4 h-4" />
                        Saved Recipes
                      </button>
                      <button
                        onClick={() => {
                          setShowSettingsMenu(false);
                          onShowPreferences();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Preferences
                      </button>
                      <button
                        onClick={() => {
                          setShowSettingsMenu(false);
                          supabase.auth.signOut();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={onShowSubscriptionModal}
                className="text-[#FF6B6B] hover:text-[#FF5555] flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg shadow-sm"
              >
                <Crown className="w-5 h-5" />
                <span className="hidden sm:inline">Upgrade</span>
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onShowAuthModal}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg shadow-sm"
          >
            <UserCircle2 className="w-5 h-5" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}
      </div>
    </div>
  );
}