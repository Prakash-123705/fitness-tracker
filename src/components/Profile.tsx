import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { User, Save, Mail, Calendar } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) {
        // Create profile if it doesn't exist
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user!.id,
              full_name: user!.user_metadata?.full_name || '',
            })
            .select()
            .single();

          if (createError) throw createError;
          setProfile(newProfile);
          setFullName(newProfile.full_name || '');
        } else {
          throw error;
        }
      } else {
        setProfile(data);
        setFullName(data.full_name || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user!.id);

      if (error) throw error;

      // Update local profile state
      setProfile(prev => prev ? { ...prev, full_name: fullName } : null);
      
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Profile</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-blue-100 rounded-full">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            <p className="text-gray-600">Manage your account details and preferences</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
              <Mail className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-900">{user?.email}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed from this interface
            </p>
          </div>

          {profile && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Member Since
              </label>
              <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-900">{formatDate(profile.created_at)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Account Statistics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-600">Account Type</p>
            <p className="text-lg font-bold text-blue-900">Free User</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-600">Status</p>
            <p className="text-lg font-bold text-green-900">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}