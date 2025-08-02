'use client';

import { useState, useEffect } from 'react';
import { Trip, SharedUser } from '@/types';
import { 
  createShareLink, 
  shareWithUser, 
  removeUserFromTrip, 
  updateTripSharingSettings,
  getUserTripPermission 
} from '@/lib/sharing-service';
import { useAuth } from '@/lib/auth-context';
import {
  XMarkIcon,
  LinkIcon,
  UserPlusIcon,
  TrashIcon,
  GlobeAltIcon,
  LockClosedIcon,
  CheckIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';

interface ShareModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onTripUpdate: (updatedTrip: Trip) => void;
}

export default function ShareModal({ trip, isOpen, onClose, onTripUpdate }: ShareModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('view');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [userPermission, setUserPermission] = useState<'owner' | 'edit' | 'view' | 'none'>('none');

  const isOwner = user && trip.userId === user.uid;

  useEffect(() => {
    if (user && trip.id) {
      getUserTripPermission(trip.id, user.uid).then(setUserPermission);
    }
  }, [user, trip.id]);

  useEffect(() => {
    if (trip.shareToken) {
      setShareLink(`${window.location.origin}/trip/shared/${trip.shareToken}`);
    }
  }, [trip.shareToken]);

  const handleCreateShareLink = async () => {
    if (!isOwner) return;
    
    setLoading(true);
    try {
      const token = await createShareLink(trip.id, sharePermission);
      const newLink = `${window.location.origin}/trip/shared/${token}`;
      setShareLink(newLink);
      
      // Update local trip state
      onTripUpdate({ ...trip, shareToken: token });
    } catch (error) {
      console.error('Error creating share link:', error);
      alert('Failed to create share link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleShareWithUser = async () => {
    if (!isOwner || !newUserEmail.trim()) return;
    
    setLoading(true);
    try {
      await shareWithUser(trip.id, newUserEmail.trim(), sharePermission, user!.uid);
      setNewUserEmail('');
      
      // Update local trip state
      const newSharedUser: SharedUser = {
        userId: '',
        email: newUserEmail.trim(),
        displayName: '',
        permission: sharePermission,
        invitedAt: new Date(),
      };
      
      const updatedTrip = {
        ...trip,
        shareSettings: {
          ...trip.shareSettings,
          sharedUsers: [...(trip.shareSettings?.sharedUsers || []), newSharedUser],
        },
      };
      
      onTripUpdate(updatedTrip);
    } catch (error) {
      console.error('Error sharing with user:', error);
      alert('Failed to share trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userEmail: string) => {
    if (!isOwner) return;
    
    setLoading(true);
    try {
      await removeUserFromTrip(trip.id, userEmail, user!.uid);
      
      // Update local trip state
      const updatedTrip = {
        ...trip,
        shareSettings: {
          ...trip.shareSettings,
          sharedUsers: (trip.shareSettings?.sharedUsers || []).filter(u => u.email !== userEmail),
        },
      };
      
      onTripUpdate(updatedTrip);
    } catch (error) {
      console.error('Error removing user:', error);
      alert('Failed to remove user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSharingSettings = async (settings: {
    isPublic?: boolean;
    allowPublicView?: boolean;
    allowPublicEdit?: boolean;
  }) => {
    if (!isOwner) return;
    
    setLoading(true);
    try {
      await updateTripSharingSettings(trip.id, settings, user!.uid);
      
      // Initialize shareSettings if it doesn't exist
      const currentShareSettings = trip.shareSettings || {
        isPublic: false,
        allowPublicView: false,
        allowPublicEdit: false,
        sharedUsers: [],
      };
      
      // Update local trip state
      const updatedTrip = {
        ...trip,
        isPublic: settings.isPublic ?? trip.isPublic,
        shareSettings: {
          ...currentShareSettings,
          isPublic: settings.isPublic ?? currentShareSettings.isPublic,
          allowPublicView: settings.allowPublicView ?? currentShareSettings.allowPublicView,
          allowPublicEdit: settings.allowPublicEdit ?? currentShareSettings.allowPublicEdit,
        },
      };
      
      onTripUpdate(updatedTrip);
    } catch (error) {
      console.error('Error updating sharing settings:', error);
      alert('Failed to update sharing settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Share "{trip.name}"</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Current Access Level */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            {userPermission === 'owner' ? (
              <LockClosedIcon className="w-5 h-5 text-blue-600" />
            ) : (
              <GlobeAltIcon className="w-5 h-5 text-green-600" />
            )}
            <span className="font-medium capitalize">{userPermission} Access</span>
          </div>
          <p className="text-sm text-gray-600">
            {userPermission === 'owner' && 'You own this trip and can manage all sharing settings.'}
            {userPermission === 'edit' && 'You can view and edit this trip.'}
            {userPermission === 'view' && 'You can view this trip but cannot make changes.'}
          </p>
        </div>

        {isOwner && (
          <>
            {/* Public Sharing Settings */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Public Access</h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={trip.shareSettings?.allowPublicView || false}
                    onChange={(e) => handleUpdateSharingSettings({ allowPublicView: e.target.checked })}
                    disabled={loading}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Anyone with the link can view this trip</span>
                </label>
                
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={trip.shareSettings?.allowPublicEdit || false}
                    onChange={(e) => handleUpdateSharingSettings({ allowPublicEdit: e.target.checked })}
                    disabled={loading}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Anyone with the link can edit this trip (requires account)</span>
                </label>
              </div>
            </div>

            {/* Share Link */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Share Link</h3>
              
              {shareLink ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    {linkCopied ? (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <select
                    value={sharePermission}
                    onChange={(e) => setSharePermission(e.target.value as 'view' | 'edit')}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="view">View Only</option>
                    <option value="edit">Can Edit</option>
                  </select>
                  
                  <button
                    onClick={handleCreateShareLink}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Create Link
                  </button>
                </div>
              )}
            </div>

            {/* Share with Specific Users */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Share with Specific People</h3>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <select
                  value={sharePermission}
                  onChange={(e) => setSharePermission(e.target.value as 'view' | 'edit')}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="view">View</option>
                  <option value="edit">Edit</option>
                </select>
                <button
                  onClick={handleShareWithUser}
                  disabled={loading || !newUserEmail.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:bg-gray-400"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  Share
                </button>
              </div>

              {/* Shared Users List */}
              {trip.shareSettings?.sharedUsers && trip.shareSettings.sharedUsers.length > 0 && (
                <div className="space-y-2">
                  {trip.shareSettings.sharedUsers.map((sharedUser, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{sharedUser.displayName || sharedUser.email}</p>
                        <p className="text-sm text-gray-600 capitalize">{sharedUser.permission} access</p>
                      </div>
                      <button
                        onClick={() => handleRemoveUser(sharedUser.email)}
                        disabled={loading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:text-gray-400"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}