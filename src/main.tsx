import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import { SavedRecipes } from './components/SavedRecipes';
import { SubscriptionPage } from './components/SubscriptionPage';
import { UserProfile } from './components/UserProfile';
import { MealPlanner } from './components/MealPlanner';
import { NewMealPlan } from './components/NewMealPlan';
import { MealPlanList } from './components/MealPlanList';
import { MealPlanView } from './components/MealPlanView';
import { Recipe } from './components/Recipe';
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
        }>
          <Route index element={<MealPlanList />} />
          <Route path="new" element={<NewMealPlan />} />
          <Route path="plans/:planId" element={<MealPlanView />} />
        </Route>
        <Route path="/recipe/:id" element={
          <PrivateRoute>
            <Recipe />
          </PrivateRoute>
        } />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  </React.StrictMode>
);