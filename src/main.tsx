import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import { SavedRecipes } from './components/SavedRecipes';
import { SubscriptionPage } from './components/SubscriptionPage';
import { UserProfile } from './components/UserProfile';
import { MealPlanner } from './components/MealPlanner';
import { PrivateRoute } from './components/PrivateRoute';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<App />} />
        <Route path="/subscription" element={<SubscriptionPage />} />

        {/* Protected routes */}
        <Route path="/saved-recipes" element={
          <PrivateRoute>
            <SavedRecipes />
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <UserProfile />
          </PrivateRoute>
        } />
        <Route path="/meal-planner" element={
          <PrivateRoute>
            <MealPlanner />
          </PrivateRoute>
        } />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  </React.StrictMode>
);