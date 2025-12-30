-- Add affiliate_link field to wish_list_items for monetization
ALTER TABLE wish_list_items
ADD COLUMN affiliate_link text;