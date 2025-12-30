/**
 * Kiko Email Trigger Configuration
 *
 * This file defines all email triggers, their conditions, scheduling,
 * and required data for the weekly outfit reminder email system.
 */

export type TriggerCategory =
  | 'trip'
  | 'weekly'
  | 'weather'
  | 'wardrobe'
  | 'wishlist'
  | 'reengagement';

export type TriggerFrequency =
  | 'once'
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'as_needed';

export interface EmailTrigger {
  id: string;
  name: string;
  description: string;
  category: TriggerCategory;
  templatePath: string;
  subject: string;
  previewText: string;
  frequency: TriggerFrequency;
  schedule?: {
    dayOfWeek?: number[]; // 0 = Sunday, 6 = Saturday
    hour?: number; // 0-23
    timezone?: 'user' | 'destination' | 'utc';
  };
  conditions: TriggerCondition[];
  requiredData: string[];
  priority: 'high' | 'medium' | 'low';
  canSuppress: boolean; // Can user disable this email type
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists' | 'days_until' | 'days_since';
  value: string | number | boolean;
}

// ============================================
// TRIP/SUITCASE TRIGGERS
// ============================================

export const tripTriggers: EmailTrigger[] = [
  {
    id: 'trip_upcoming_week',
    name: 'Trip Coming Up (1 Week)',
    description: 'Sent 7 days before a trip starts to encourage outfit planning',
    category: 'trip',
    templatePath: 'templates/trip/trip-upcoming-week.html',
    subject: '{{tripName}} is 1 week away! Time to plan your outfits',
    previewText: "Let's make sure you're packed and styled for {{destination}}",
    frequency: 'once',
    conditions: [
      { field: 'suitcase.start_date', operator: 'days_until', value: 7 },
      { field: 'suitcase.plan_type', operator: 'equals', value: 'trip' }
    ],
    requiredData: [
      'userName', 'tripName', 'destination', 'tripStartDate', 'tripEndDate',
      'tripDuration', 'tripTypes', 'weatherForecast', 'planningProgress',
      'plannedDays', 'suitcaseId'
    ],
    priority: 'high',
    canSuppress: true
  },
  {
    id: 'trip_upcoming_3days',
    name: 'Trip Reminder (3 Days)',
    description: 'Sent 3 days before trip for final outfit review',
    category: 'trip',
    templatePath: 'templates/trip/trip-upcoming-3days.html',
    subject: '3 days until {{tripName}}! Final outfit check',
    previewText: 'Make sure your suitcase is ready for {{destination}}',
    frequency: 'once',
    conditions: [
      { field: 'suitcase.start_date', operator: 'days_until', value: 3 },
      { field: 'suitcase.plan_type', operator: 'equals', value: 'trip' }
    ],
    requiredData: [
      'userName', 'destination', 'tripDuration', 'allDaysPlanned', 'unplannedDays',
      'weatherForecast', 'suitcaseId'
    ],
    priority: 'high',
    canSuppress: true
  },
  {
    id: 'trip_tomorrow',
    name: 'Trip Tomorrow',
    description: 'Evening reminder with Day 1 outfit details',
    category: 'trip',
    templatePath: 'templates/trip/trip-tomorrow.html',
    subject: "Tomorrow's the day! Here's your Day 1 outfit for {{destination}}",
    previewText: 'Your {{tripName}} adventure begins tomorrow',
    frequency: 'once',
    schedule: {
      hour: 18, // 6pm local time
      timezone: 'user'
    },
    conditions: [
      { field: 'suitcase.start_date', operator: 'days_until', value: 1 },
      { field: 'suitcase.plan_type', operator: 'equals', value: 'trip' }
    ],
    requiredData: [
      'userName', 'destination', 'tripName', 'day1Date', 'day1Occasion',
      'day1Outfit', 'day1Weather', 'suitcaseId'
    ],
    priority: 'high',
    canSuppress: false
  },
  {
    id: 'trip_daily_outfit',
    name: 'Daily Outfit Reminder',
    description: 'Morning reminder with planned outfit for current trip day',
    category: 'trip',
    templatePath: 'templates/trip/trip-daily-outfit.html',
    subject: 'Day {{dayNumber}} outfit for {{destination}}',
    previewText: '{{weatherCondition}}, {{temperature}}° - here\'s what to wear',
    frequency: 'daily',
    schedule: {
      hour: 7, // 7am destination time
      timezone: 'destination'
    },
    conditions: [
      { field: 'suitcase.is_active', operator: 'equals', value: true },
      { field: 'suitcase_outfit.outfit_date', operator: 'equals', value: 'today' }
    ],
    requiredData: [
      'userName', 'tripName', 'destination', 'dayNumber', 'totalDays',
      'currentDate', 'weather', 'outfit', 'occasion', 'weatherAdvisory',
      'tomorrowPreview', 'suitcaseId'
    ],
    priority: 'high',
    canSuppress: true
  },
  {
    id: 'trip_completed',
    name: 'Post-Trip Summary',
    description: 'Recap sent day after trip ends',
    category: 'trip',
    templatePath: 'templates/trip/trip-completed.html',
    subject: 'Welcome back! How was {{destination}}?',
    previewText: "Let's save your favorite outfits from {{tripName}}",
    frequency: 'once',
    conditions: [
      { field: 'suitcase.end_date', operator: 'days_since', value: 1 },
      { field: 'suitcase.plan_type', operator: 'equals', value: 'trip' }
    ],
    requiredData: [
      'userName', 'tripName', 'destination', 'tripDuration', 'totalOutfits',
      'uniqueItems', 'mostWornItems', 'nextTrip', 'suitcaseId'
    ],
    priority: 'medium',
    canSuppress: true
  }
];

// ============================================
// WEEKLY PLANNING TRIGGERS
// ============================================

export const weeklyTriggers: EmailTrigger[] = [
  {
    id: 'week_start_planning',
    name: 'Plan Your Week',
    description: 'Weekly prompt to plan outfits for the upcoming week',
    category: 'weekly',
    templatePath: 'templates/weekly/week-start-planning.html',
    subject: 'Plan your week: {{weekDateRange}}',
    previewText: '{{weatherSummary}} - let\'s pick your outfits',
    frequency: 'weekly',
    schedule: {
      dayOfWeek: [0], // Sunday
      hour: 18, // 6pm
      timezone: 'user'
    },
    conditions: [],
    requiredData: [
      'userName', 'weekDateRange', 'weekForecast', 'weatherTip',
      'hasLocalPlan', 'localPlanId', 'plannedDays'
    ],
    priority: 'medium',
    canSuppress: true
  },
  {
    id: 'week_midweek_check',
    name: 'Midweek Check-in',
    description: 'Wednesday reminder with rest-of-week weather and outfit ideas',
    category: 'weekly',
    templatePath: 'templates/weekly/week-midweek-check.html',
    subject: "Midweek outfit check: How's your week going?",
    previewText: '{{remainingDays}} days left - here\'s what\'s coming up',
    frequency: 'weekly',
    schedule: {
      dayOfWeek: [3], // Wednesday
      hour: 8,
      timezone: 'user'
    },
    conditions: [],
    requiredData: [
      'userName', 'remainingDays', 'weatherAlert', 'suggestedOutfit',
      'weekendPlans', 'hasWeekPlan', 'weekPlanId'
    ],
    priority: 'low',
    canSuppress: true
  }
];

// ============================================
// WEATHER-BASED TRIGGERS
// ============================================

export const weatherTriggers: EmailTrigger[] = [
  {
    id: 'weather_change_alert',
    name: 'Weather Change Alert',
    description: 'Notification when forecast changes significantly',
    category: 'weather',
    templatePath: 'templates/weather/weather-change-alert.html',
    subject: 'Weather alert: {{changeType}} on {{affectedDate}}',
    previewText: 'Your planned outfit might need adjusting',
    frequency: 'as_needed',
    conditions: [
      { field: 'weather.temperature_change', operator: 'greater_than', value: 15 }
    ],
    requiredData: [
      'userName', 'affectedDate', 'previousWeather', 'newWeather',
      'hasPlannedOutfit', 'plannedOutfit', 'suggestions', 'recommendedItems',
      'planId', 'dayNumber', 'alertColor', 'alertColorDark', 'alertIcon'
    ],
    priority: 'high',
    canSuppress: true
  },
  {
    id: 'weather_weekly_forecast',
    name: 'Weekly Weather Outlook',
    description: 'Sunday evening weather overview for outfit planning',
    category: 'weather',
    templatePath: 'templates/weather/weather-weekly-forecast.html',
    subject: 'Your week ahead: {{weatherSummary}}',
    previewText: '{{temperatureRange}} this week - outfit planning tips inside',
    frequency: 'weekly',
    schedule: {
      dayOfWeek: [0], // Sunday
      hour: 17, // 5pm
      timezone: 'user'
    },
    conditions: [],
    requiredData: [
      'userName', 'location', 'primaryWeatherIcon', 'temperatureRange',
      'forecast', 'weeklySummary', 'coldDays', 'mildDays', 'warmDays', 'rainyDays'
    ],
    priority: 'medium',
    canSuppress: true
  }
];

// ============================================
// WARDROBE ENGAGEMENT TRIGGERS
// ============================================

export const wardrobeTriggers: EmailTrigger[] = [
  {
    id: 'wardrobe_unused_items',
    name: 'Rediscover Your Wardrobe',
    description: 'Highlights items not worn in 30+ days',
    category: 'wardrobe',
    templatePath: 'templates/wardrobe/wardrobe-unused-items.html',
    subject: 'Rediscover these items in your wardrobe',
    previewText: '{{itemCount}} items you haven\'t worn in a while',
    frequency: 'biweekly',
    schedule: {
      dayOfWeek: [2], // Tuesday
      hour: 10,
      timezone: 'user'
    },
    conditions: [
      { field: 'unused_items_count', operator: 'greater_than', value: 3 }
    ],
    requiredData: [
      'userName', 'unusedCount', 'unusedItems', 'outfitSuggestions'
    ],
    priority: 'low',
    canSuppress: true
  },
  {
    id: 'wardrobe_new_combinations',
    name: 'New Outfit Ideas',
    description: 'Sent 3 days after uploading a new item',
    category: 'wardrobe',
    templatePath: 'templates/wardrobe/wardrobe-new-combinations.html',
    subject: '{{newCombinations}} new outfit ideas with your {{itemCategory}}',
    previewText: 'Your new {{itemDescription}} works great with these pieces',
    frequency: 'once',
    conditions: [
      { field: 'wardrobe_item.created_at', operator: 'days_since', value: 3 }
    ],
    requiredData: [
      'userName', 'itemCategory', 'newCombinations', 'newItem',
      'suggestedOutfits', 'matchingItems', 'bestPairings'
    ],
    priority: 'medium',
    canSuppress: true
  },
  {
    id: 'wardrobe_style_insights',
    name: 'Your Style Report',
    description: 'Monthly style analytics and insights',
    category: 'wardrobe',
    templatePath: 'templates/wardrobe/wardrobe-style-insights.html',
    subject: 'Your {{monthName}} Style Report',
    previewText: '{{totalOutfits}} outfits created, your top colors, and more',
    frequency: 'monthly',
    schedule: {
      dayOfWeek: [1], // First Monday
      hour: 9,
      timezone: 'user'
    },
    conditions: [
      { field: 'date.day_of_month', operator: 'less_than', value: 8 }
    ],
    requiredData: [
      'userName', 'monthName', 'year', 'stats', 'mostWornItems',
      'topColors', 'insights', 'wardrobeStats', 'nextMonthName', 'nextMonthGoal'
    ],
    priority: 'medium',
    canSuppress: true
  }
];

// ============================================
// WISHLIST TRIGGERS
// ============================================

export const wishlistTriggers: EmailTrigger[] = [
  {
    id: 'wishlist_outfit_potential',
    name: 'Complete Your Outfit',
    description: 'Shows how wishlist items would expand outfit options',
    category: 'wishlist',
    templatePath: 'templates/wishlist/wishlist-outfit-potential.html',
    subject: '{{itemName}} would create {{outfitCount}} new outfits!',
    previewText: 'See how your wishlist items work with your wardrobe',
    frequency: 'weekly',
    schedule: {
      dayOfWeek: [5], // Friday
      hour: 12,
      timezone: 'user'
    },
    conditions: [
      { field: 'wishlist_items_count', operator: 'greater_than', value: 0 }
    ],
    requiredData: [
      'userName', 'topWishlistItems', 'totalWishlistItems',
      'totalPotentialOutfits', 'gapFillers'
    ],
    priority: 'low',
    canSuppress: true
  },
  {
    id: 'capsule_missing_items',
    name: 'Capsule Completion',
    description: 'Progress update on incomplete capsule wardrobes',
    category: 'wishlist',
    templatePath: 'templates/wishlist/capsule-missing-items.html',
    subject: 'Complete your {{capsuleName}} capsule: {{missingCount}} items to go',
    previewText: "You're {{percentComplete}}% there! Here's what you still need",
    frequency: 'weekly',
    schedule: {
      dayOfWeek: [6], // Saturday
      hour: 10,
      timezone: 'user'
    },
    conditions: [
      { field: 'capsule.percent_complete', operator: 'less_than', value: 100 },
      { field: 'capsule.percent_complete', operator: 'greater_than', value: 0 }
    ],
    requiredData: [
      'userName', 'capsuleName', 'capsuleId', 'percentComplete',
      'itemsOwned', 'totalItems', 'missingCount', 'ownedItems',
      'missingItems', 'totalOutfitPotential'
    ],
    priority: 'low',
    canSuppress: true
  }
];

// ============================================
// RE-ENGAGEMENT TRIGGERS
// ============================================

export const reengagementTriggers: EmailTrigger[] = [
  {
    id: 'reengagement_7days',
    name: 'We Miss You (Soft)',
    description: 'Gentle reminder after 7 days of inactivity',
    category: 'reengagement',
    templatePath: 'templates/reengagement/reengagement-7days.html',
    subject: 'Your wardrobe misses you, {{userName}}',
    previewText: 'Quick outfit ideas waiting for you',
    frequency: 'once',
    conditions: [
      { field: 'user.last_active', operator: 'days_since', value: 7 }
    ],
    requiredData: [
      'userName', 'wardrobeCount', 'possibleOutfits', 'favoritesCount',
      'quickOutfit', 'currentWeather', 'location'
    ],
    priority: 'medium',
    canSuppress: true
  },
  {
    id: 'reengagement_14days',
    name: 'Style Waiting',
    description: 'Follow-up after 14 days of inactivity',
    category: 'reengagement',
    templatePath: 'templates/reengagement/reengagement-14days.html',
    subject: '{{userName}}, your style is waiting',
    previewText: 'New features and outfit ideas since you\'ve been away',
    frequency: 'once',
    conditions: [
      { field: 'user.last_active', operator: 'days_since', value: 14 }
    ],
    requiredData: [
      'userName', 'totalPossibleOutfits', 'unusedItems'
    ],
    priority: 'medium',
    canSuppress: true
  },
  {
    id: 'milestone_outfits',
    name: 'Outfit Milestone',
    description: 'Celebration email at 10, 25, 50, 100 outfits',
    category: 'reengagement',
    templatePath: 'templates/reengagement/milestone-outfits.html',
    subject: "{{milestoneNumber}} outfits! You're a style pro, {{userName}}",
    previewText: 'Celebrating your fashion journey milestone',
    frequency: 'once',
    conditions: [
      { field: 'user.total_outfits', operator: 'equals', value: '{{milestone}}' }
    ],
    requiredData: [
      'userName', 'milestoneNumber', 'stats', 'topOutfit',
      'nextMilestone', 'outfitsToGo', 'motivationalQuote'
    ],
    priority: 'high',
    canSuppress: false
  }
];

// ============================================
// ALL TRIGGERS EXPORT
// ============================================

export const allTriggers: EmailTrigger[] = [
  ...tripTriggers,
  ...weeklyTriggers,
  ...weatherTriggers,
  ...wardrobeTriggers,
  ...wishlistTriggers,
  ...reengagementTriggers
];

export const triggersByCategory: Record<TriggerCategory, EmailTrigger[]> = {
  trip: tripTriggers,
  weekly: weeklyTriggers,
  weather: weatherTriggers,
  wardrobe: wardrobeTriggers,
  wishlist: wishlistTriggers,
  reengagement: reengagementTriggers
};

export const getTriggerById = (id: string): EmailTrigger | undefined => {
  return allTriggers.find(trigger => trigger.id === id);
};

export const getTriggersByPriority = (priority: 'high' | 'medium' | 'low'): EmailTrigger[] => {
  return allTriggers.filter(trigger => trigger.priority === priority);
};

// ============================================
// MILESTONE DEFINITIONS
// ============================================

export const outfitMilestones = [10, 25, 50, 100, 250, 500, 1000];

export const motivationalQuotes = [
  "Style is a way to say who you are without having to speak.",
  "Fashion is about dressing according to what's fashionable. Style is more about being yourself.",
  "The best fashion is your own confidence.",
  "Dress like you're already famous.",
  "Life is too short to wear boring clothes.",
  "Style is knowing who you are, what you want to say, and not giving a damn."
];

// ============================================
// EMAIL PREFERENCES SCHEMA
// ============================================

export interface UserEmailPreferences {
  userId: string;
  enabled: boolean;
  categories: {
    trip: boolean;
    weekly: boolean;
    weather: boolean;
    wardrobe: boolean;
    wishlist: boolean;
    reengagement: boolean;
  };
  suppressedTriggers: string[]; // Specific trigger IDs user has disabled
  preferredTime: {
    weekday: number; // 0-23
    weekend: number; // 0-23
  };
  timezone: string;
  lastEmailSent: Record<string, Date>; // trigger_id -> last sent date
}

export const defaultEmailPreferences: Omit<UserEmailPreferences, 'userId'> = {
  enabled: true,
  categories: {
    trip: true,
    weekly: true,
    weather: true,
    wardrobe: true,
    wishlist: true,
    reengagement: true
  },
  suppressedTriggers: [],
  preferredTime: {
    weekday: 8, // 8am
    weekend: 10 // 10am
  },
  timezone: 'America/New_York',
  lastEmailSent: {}
};
