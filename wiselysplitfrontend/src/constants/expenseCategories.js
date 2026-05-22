/**
 * Expense categories used by the BaseExpenseFields category dropdown and
 * anywhere else that needs to render a category with its matching icon.
 * Each entry pairs the persisted string value with a Heroicon that the
 * IconCombobox renders to the left of the label.
 */

import {
  CakeIcon,
  TruckIcon,
  HomeIcon,
  BoltIcon,
  HeartIcon,
  FilmIcon,
  ShoppingBagIcon,
  AcademicCapIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  GiftIcon,
  UsersIcon,
  FaceSmileIcon,
  TagIcon,
} from '@heroicons/react/24/solid'


export const EXPENSE_CATEGORIES = [
  { value: 'Food & Dining', label: 'Food & Dining', Icon: CakeIcon },
  { value: 'Transport', label: 'Transport', Icon: TruckIcon },
  { value: 'Housing', label: 'Housing', Icon: HomeIcon },
  { value: 'Utilities', label: 'Utilities', Icon: BoltIcon },
  { value: 'Health & Medical', label: 'Health & Medical', Icon: HeartIcon },
  { value: 'Entertainment', label: 'Entertainment', Icon: FilmIcon },
  { value: 'Shopping', label: 'Shopping', Icon: ShoppingBagIcon },
  { value: 'Education', label: 'Education', Icon: AcademicCapIcon },
  { value: 'Personal Care', label: 'Personal Care', Icon: SparklesIcon },
  { value: 'Travel', label: 'Travel', Icon: PaperAirplaneIcon },
  { value: 'Finance', label: 'Finance', Icon: BanknotesIcon },
  { value: 'Savings & Investments', label: 'Savings & Investments', Icon: BuildingLibraryIcon },
  { value: 'Gifts & Donations', label: 'Gifts & Donations', Icon: GiftIcon },
  { value: 'Kids & Family', label: 'Kids & Family', Icon: UsersIcon },
  { value: 'Pets', label: 'Pets', Icon: FaceSmileIcon },
  { value: 'Other', label: 'Other', Icon: TagIcon },
]

/** Quick lookup of category value -> Icon component. */
export const EXPENSE_CATEGORY_ICON_MAP = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.value, c.Icon])
)
