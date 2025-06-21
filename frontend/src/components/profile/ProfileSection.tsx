'use client';

import { useState, useEffect } from 'react';
import { User, TrendingUp, Briefcase, Clock, Save } from 'lucide-react';
import { workProfileMethods, signAndSubmitTransaction } from '@/lib/stellar-working';

interface ProfileSectionProps {
  publicKey: string;
}

interface Profile {
  yearsExperience: number;
  currentJobDuration: number;
  jobChanges: number;
  sector: string;
  riskScore: number;
  riskTier: number;
}

export default function ProfileSection({ publicKey }: ProfileSectionProps) {
  const [profile, setProfile] = useState<Profile>({
    yearsExperience: 0,
    currentJobDuration: 0,
    jobChanges: 0,
    sector: '',
    riskScore: 0,
    riskTier: 5,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Mock initial data
  useEffect(() => {
    const mockProfile: Profile = {
      yearsExperience: 5,
      currentJobDuration: 18,
      jobChanges: 2,
      sector: 'technology',
      riskScore: 75,
      riskTier: 2,
    };
    setProfile(mockProfile);
  }, []);

  // Calculate risk score when profile changes
  useEffect(() => {
    const score = calculateRiskScore(
      profile.yearsExperience,
      profile.currentJobDuration,
      profile.jobChanges
    );
    const tier = getRiskTier(score);
    
    setProfile(prev => ({ ...prev, riskScore: score, riskTier: tier }));
  }, [profile.yearsExperience, profile.currentJobDuration, profile.jobChanges]);

  const calculateRiskScore = (years: number, duration: number, changes: number): number => {
    let score = 25; // Base score

    // Years of experience (0-10 points)
    if (years >= 8) score += 10;
    else if (years >= 5) score += 7;
    else if (years >= 3) score += 5;
    else if (years >= 1) score += 2;

    // Current job duration (0-7 points)  
    if (duration >= 24) score += 7;
    else if (duration >= 12) score += 5;
    else if (duration >= 6) score += 3;

    // Job changes (0-3 points)
    if (changes <= 1) score += 3;
    else if (changes <= 2) score += 2;
    else if (changes <= 3) score += 1;
    else score -= Math.max(0, (changes - 3) * 2);

    return Math.max(0, Math.min(25, score));
  };

  const getRiskTier = (score: number): number => {
    if (score >= 20) return 1; // A Level
    if (score >= 15) return 2; // B Level  
    if (score >= 10) return 3; // C Level
    return 4; // D Level
  };

  const getRiskTierInfo = (tier: number) => {
    const tiers = {
      1: { label: 'A Level (Excellent)', color: 'text-green-600', rate: '5-8%' },
      2: { label: 'B Level (Good)', color: 'text-blue-600', rate: '8-12%' },
      3: { label: 'C Level (Fair)', color: 'text-yellow-600', rate: '12-18%' },
      4: { label: 'D Level (Poor)', color: 'text-orange-600', rate: '18-25%' },
      5: { label: 'Not Rated', color: 'text-gray-600', rate: 'N/A' },
    };
    return tiers[tier as keyof typeof tiers];
  };

  const updateProfile = async () => {
    setIsUpdating(true);
    try {
      // workProfileMethods'da updateProfile yok, şimdilik basit alert gösterelim
      alert('Profile update functionality will be implemented soon!');
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const tierInfo = getRiskTierInfo(profile.riskTier);

  return (
    <div className="space-y-6">
      {/* Profile Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <User className="w-6 h-6 text-blue-600 mr-2" />
          Work Profile
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Years of Experience
            </label>
            <input
              type="number"
              value={profile.yearsExperience}
              onChange={(e) => setProfile({ ...profile, yearsExperience: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="5"
              min="0"
              max="50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Job Duration (months)
            </label>
            <input
              type="number"
              value={profile.currentJobDuration}
              onChange={(e) => setProfile({ ...profile, currentJobDuration: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="18"
              min="0"
              max="600"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Job Changes
            </label>
            <input
              type="number"
              value={profile.jobChanges}
              onChange={(e) => setProfile({ ...profile, jobChanges: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="2"
              min="0"
              max="20"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sector
            </label>
            <select
              value={profile.sector}
              onChange={(e) => setProfile({ ...profile, sector: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select sector</option>
              <option value="technology">Technology</option>
              <option value="finance">Finance</option>
              <option value="healthcare">Healthcare</option>
              <option value="education">Education</option>
              <option value="retail">Retail</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            onClick={updateProfile}
            disabled={isUpdating || isSaved}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            {isUpdating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Updating...</span>
              </>
            ) : isSaved ? (
              <>
                <Save className="w-4 h-4" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Update Profile</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-6 h-6 text-purple-600 mr-2" />
          Risk Assessment
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Risk Score */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Risk Score</span>
              <span className="text-lg font-bold text-gray-900">{profile.riskScore}/25</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(profile.riskScore / 25) * 100}%` }}
              ></div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Higher score = Better lending terms
            </div>
          </div>
          
          {/* Risk Tier */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">Risk Tier</span>
              <span className={`text-lg font-bold ${tierInfo.color}`}>
                Tier {profile.riskTier}
              </span>
            </div>
            <div className={`p-4 rounded-lg border ${tierInfo.color.replace('text-', 'border-').replace('-600', '-200')} ${tierInfo.color.replace('text-', 'bg-').replace('-600', '-50')}`}>
              <div className={`font-medium ${tierInfo.color}`}>{tierInfo.label}</div>
              <div className="text-sm text-gray-600 mt-1">Interest Rate: {tierInfo.rate}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Briefcase className="w-6 h-6 text-green-600 mr-2" />
          Profile Statistics
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{profile.yearsExperience}</div>
            <div className="text-sm text-gray-600">Years Experience</div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{profile.currentJobDuration}</div>
            <div className="text-sm text-gray-600">Months Current Job</div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{profile.jobChanges}</div>
            <div className="text-sm text-gray-600">Job Changes</div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">How to Improve Your Score</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Stay longer in your current position</li>
            <li>• Gain more years of experience</li>
            <li>• Maintain stable employment history</li>
            <li>• Keep detailed work records</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
