# Kiko Weekly Outfit Reminder Emails

## Email Trigger System Overview

This document outlines all email triggers for the Kiko fashion platform, organized by category.

---

## Trigger Categories

### 1. Trip/Suitcase Triggers
| Trigger ID | Name | When Fired | Frequency |
|------------|------|------------|-----------|
| `trip_upcoming_week` | Trip Coming Up (1 Week) | 7 days before trip start | Once |
| `trip_upcoming_3days` | Trip Reminder (3 Days) | 3 days before trip start | Once |
| `trip_tomorrow` | Trip Tomorrow | 1 day before trip start | Once |
| `trip_daily_outfit` | Daily Outfit Reminder | Morning of each trip day | Daily |
| `trip_unplanned_days` | Unplanned Days Alert | 5+ days before trip with gaps | Once |
| `trip_completed` | Post-Trip Summary | Day after trip ends | Once |

### 2. Weekly Planning Triggers
| Trigger ID | Name | When Fired | Frequency |
|------------|------|------------|-----------|
| `week_start_planning` | Plan Your Week | Sunday 6pm / Monday 6am | Weekly |
| `week_midweek_check` | Midweek Check-in | Wednesday 8am | Weekly |
| `local_plan_reminder` | Local Plan Outfit | Morning of planned local days | Daily |

### 3. Weather-Based Triggers
| Trigger ID | Name | When Fired | Frequency |
|------------|------|------------|-----------|
| `weather_change_alert` | Weather Change Alert | When forecast changes significantly | As needed |
| `weather_weekly_forecast` | Weekly Weather Outlook | Sunday evening | Weekly |
| `weather_outfit_mismatch` | Outfit Weather Warning | When planned outfit doesn't match weather | As needed |

### 4. Wardrobe Engagement Triggers
| Trigger ID | Name | When Fired | Frequency |
|------------|------|------------|-----------|
| `wardrobe_unused_items` | Rediscover Your Wardrobe | Items unused 30+ days | Bi-weekly |
| `wardrobe_new_combinations` | New Outfit Ideas | New item uploaded + 3 days | Once per item |
| `wardrobe_seasonal_rotation` | Seasonal Wardrobe Refresh | Season change (quarterly) | Quarterly |
| `wardrobe_style_insights` | Your Style Report | First of month | Monthly |

### 5. Wish List Triggers
| Trigger ID | Name | When Fired | Frequency |
|------------|------|------------|-----------|
| `wishlist_outfit_potential` | Complete Your Outfit | Wishlist item matches wardrobe | Weekly digest |
| `wishlist_reminder` | Wishlist Check-in | Items on wishlist 14+ days | Bi-weekly |
| `capsule_missing_items` | Capsule Completion | Missing items in capsule wardrobe | Weekly |

### 6. Re-engagement Triggers
| Trigger ID | Name | When Fired | Frequency |
|------------|------|------------|-----------|
| `reengagement_7days` | We Miss You (Soft) | 7 days inactive | Once |
| `reengagement_14days` | Style Waiting | 14 days inactive | Once |
| `reengagement_30days` | Come Back Offer | 30 days inactive | Once |
| `milestone_outfits` | Outfit Milestone | Every 10/25/50/100 outfits created | Once per milestone |

---

## Email Design Principles

1. **Mobile-First**: 600px max width, large touch targets
2. **Visual Focus**: Hero images of outfits, minimal text
3. **Clear CTA**: One primary action per email
4. **Personalization**: User name, their actual wardrobe items
5. **Weather Integration**: Show relevant weather data
6. **Unsubscribe**: Easy opt-out in footer

---

## File Structure

```
src/emails/
├── README.md                    # This file
├── base-template.html           # Base email layout
├── trigger-config.ts            # Trigger definitions & scheduling
├── templates/
│   ├── trip/
│   │   ├── trip-upcoming-week.html
│   │   ├── trip-upcoming-3days.html
│   │   ├── trip-tomorrow.html
│   │   ├── trip-daily-outfit.html
│   │   └── trip-completed.html
│   ├── weekly/
│   │   ├── week-start-planning.html
│   │   └── week-midweek-check.html
│   ├── weather/
│   │   ├── weather-change-alert.html
│   │   └── weather-weekly-forecast.html
│   ├── wardrobe/
│   │   ├── wardrobe-unused-items.html
│   │   ├── wardrobe-new-combinations.html
│   │   └── wardrobe-style-insights.html
│   ├── wishlist/
│   │   ├── wishlist-outfit-potential.html
│   │   └── capsule-missing-items.html
│   └── reengagement/
│       ├── reengagement-7days.html
│       ├── reengagement-14days.html
│       └── milestone-outfits.html
```

---

## Template Variables

All templates support these dynamic variables:

```typescript
interface EmailVariables {
  // User
  userName: string;
  userEmail: string;

  // Trip (when applicable)
  tripName?: string;
  destination?: string;
  tripStartDate?: string;
  tripEndDate?: string;
  daysUntilTrip?: number;

  // Weather
  temperature?: string;
  weatherCondition?: string;
  weatherIcon?: string;

  // Outfit
  outfitImageUrl?: string;
  outfitItems?: Array<{name: string; imageUrl: string; category: string}>;

  // Wardrobe
  unusedItems?: Array<{name: string; imageUrl: string; daysSinceUsed: number}>;
  newCombinations?: number;

  // Stats
  totalOutfits?: number;
  favoriteCount?: number;

  // Links
  appUrl: string;
  unsubscribeUrl: string;
}
```
