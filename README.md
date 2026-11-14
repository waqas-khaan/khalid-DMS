# Dairy Business Management System

A responsive web and mobile application for managing commercial dairy farm operations, raw milk collection, route dispatches, shop customer arrears ledgers, employee attendance & payroll, operational expenses, and executive financial dashboards.

Built with **Vue 3 (Composition API, `<script setup>`)**, **Vuetify 3**, **Vue Router 4**, **Pinia**, **Vue CLI (`@vue/cli-service`)**, **Firebase (Authentication + Cloud Firestore with offline persistence + Hosting)**, and **Capacitor 6** for native Android APK/AAB packaging.

---

## 🚀 Key Modules & Business Logic

### 1. Masters (CRUD)
- **Vehicles**: Fleet management (Registration plate, model, tank/milk capacity in Liters, status, notes).
- **Drivers**: Delivery drivers (Name, phone, driving license number, active status, notes).
- **Areas / Routes**: Distribution sectors (e.g., `Hayatabad`, `Jalalabad`, `University Town`, `Saddar`).
- **Shops**: Customer dairy shops (Code, Name, Owner Name, Phone, Area/Route link, Default milk price per Kg, Opening arrears, and live Current arrears).

### 2. Milk Arrival Register
- Daily entry of raw milk arriving at the farm:
  - Date (defaults to today)
  - Quantity
  - Unit selector (`Liter` or `Kg`)
  - Source (e.g., Morning Milking, Evening Milking, Village Collection Center)
  - Notes
- **Configurable Conversion Factor**: Converts quantity between Liters and Kilograms using a configurable factor stored in settings (default `1.03` kg/liter).
- List view with date filter and daily totals (Total Liters, Total Kg, Batch Count).

### 3. Shop Milk Dispatch & Arrears Ledger
- **Screen 1**: Wizard to select Date, Route/Area, Vehicle, and Driver -> click **Next**.
- **Screen 2**:
  - Route header displaying the selected details.
  - Table listing all shops belonging to the selected route.
  - Columns:
    1. **Shop Code**
    2. **Shop / Owner Name**
    3. **Milk Price** (defaults to shop default price, editable per shop)
    4. **Cans** (count)
    5. **Kgs** (weight dispatched)
    6. **Today's Milk**
    7. **Today Amount**: `todayMilk × price`
    8. **Previous Arrears**: Shop's balance loaded from master ledger
    9. **Today Collection**: Cash received today from shopkeeper
    10. **Total Payable**: `Previous Arrears + Today Amount`
    11. **New Arrears**: `Total Payable - Today Collection`
  - **Grand Totals**: Real-time sum of Cans, Milk (Kg), Today Amount, Previous Arrears, Collections, and New Arrears.
  - **Batched Persistence**: Updates dispatch record with items subcollection (`dispatches/{id}/items`), updates each shop's `currentArrears`, and updates daily/monthly statistics.
  - **Same-Day Edit**: Allows editing a dispatch created on the same day and recalculating arrears.

### 4. Employee Attendance, Advances & Payroll
- **Employee Master**: Name, phone, designation, monthly base salary, joining date, active status.
- **Daily Bulk Attendance**:
  - Quick bulk marking screen (`Present` / `Absent`) for all active employees by date.
  - One-click **"Mark All Present"** button.
- **Attendance & Pay Rules**:
  - **2 absences per month allowed without cut**.
  - `totalDaysInMonth` for the selected month (e.g., 28, 30, 31).
  - `perDaySalary = monthlySalary / totalDaysInMonth`
  - `deductibleDays = max(0, absents - 2)`
  - `payCut = deductibleDays × perDaySalary`
- **Advances**:
  - Record advances: Employee, Date, Amount, Reason ("kis kaam ke liye").
- **Monthly Salary & Slip**:
  - `netPayable = salary - payCut - advances`
  - Record salary payment (Cash, Bank Transfer, Cheque).
  - **Detailed Salary Slip**: Breakdown of attendance, absences, 2 free days allowance, per-day rate, pay cut amount, list of advances with date/amount/reason, and net payable with print view.

### 5. Operating Expenses Ledger
- **Categories**: `Food`, `Home`, `Transport` (Admin can add custom categories).
- **Transport Sub-Types**: `Diesel` and `Maintenance` (with optional vehicle link).
- **Expense Entry**: Date, Category, Sub-Category, Vehicle link, Amount, Notes.
- **Default View**: Today's expenses, with Date and Date-Range filters.
- **Totals**: Overall total and category cards (Food, Home, Transport - Diesel & Maintenance).

### 6. Executive Operations Dashboard
- **Daily Cards**:
  - Total Income (Today's cash collection)
  - Total Arrears (Sum of all shop customer arrears)
  - Milk Received Today (Kg and Liters)
  - Milk Dispatched Today (Kg and Amount)
  - Total Expense Today
  - Expense breakdown cards per category (Food, Home, Transport - Diesel & Maintenance)
- **Monthly Cards**:
  - Monthly Income, Monthly Milk Received, Monthly Dispatched, Monthly Expenses, Salaries Paid, Advances Given.
- **Interactive Charts**:
  - Milk Flow Trend (Received vs Dispatched).
  - Financial Comparison (Income, Expenses, Salaries, Advances).
- **Fast Stats Storage**: Aggregated documents (`stats/daily_YYYY-MM-DD` and `stats/monthly_YYYY-MM`) maintained on writes for instant loading.

---

## 🛠️ Tech Stack
- **Frontend Framework**: Vue 3 (`<script setup>`, Composition API)
- **UI Component Library**: Vuetify 3 (`vuetify@3.x`, `@mdi/font`)
- **State Management**: Pinia 2
- **Routing**: Vue Router 4
- **Backend / Database**: Firebase (Auth + Cloud Firestore with offline IndexedDB persistence + Hosting)
- **Mobile Packaging**: Capacitor 6 (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`)
- **Tooling & Build System**: Vue CLI 5 (`@vue/cli-service`, `webpack`, `babel.config.js`, `vue.config.js`)

---

## ⚙️ Environment Configuration (.env)

Create a `.env` file in the root directory (copied from `.env.example`):

```env
VUE_APP_FIREBASE_API_KEY=your_firebase_api_key
VUE_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VUE_APP_FIREBASE_PROJECT_ID=your_project_id
VUE_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VUE_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VUE_APP_FIREBASE_APP_ID=your_firebase_app_id
VUE_APP_TITLE="Dairy Business Management System"
```

> **Offline & Demo Mode Note**: If Firebase credentials are not yet configured or in mock development mode, the system automatically runs with offline persistence (LocalStorage & IndexedDB) and includes a one-click database seeder.

---

## 🏃 Running Locally

```bash
# Install dependencies
npm install

# Start development server using Vue CLI
npm run serve
```

Open your browser at `http://localhost:3000` (or `http://localhost:8080`).

### 🔑 Default Demo Accounts
- **Admin**: `admin@dairy.com` / `admin123` (Full access to all modules, settings, and user management)
- **Staff**: `staff@dairy.com` / `staff123` (Operational access to Milk Arrivals, Dispatches, Attendance, Expenses)

---

## 📦 Building for Production & Firebase Hosting

```bash
# Build production bundle into dist/ using vue-cli-service
npm run build

# Deploy to Firebase Hosting (requires firebase-tools CLI)
firebase deploy --only hosting,firestore:rules,firestore:indexes
```

---

## 📱 Capacitor Android Mobile App Build

The project is pre-configured with Capacitor for packaging as an Android app.

```bash
# 1. Build the web distribution
npm run build

# 2. Sync web build assets with native Android project
npx cap sync android

# 3. Open project in Android Studio
npx cap open android
```

### In Android Studio:
1. Wait for Gradle sync to complete.
2. Select your connected Android phone or Android Emulator.
3. Click **Run (Shift+F10)** to install and launch the app.
4. To generate a release APK: **Build > Generate Signed Bundle / APK > APK**.

---

## 🔒 Firestore Security Rules

See `firestore.rules` for role-based security rules enforcing Admin vs Staff permissions:
- `users`: User profiles restricted to authenticated users (admin can manage all).
- `settings`: Readable by authenticated users; writable by admin.
- `masters` (vehicles, drivers, areas, shops): Staff and Admin can read/write.
- `dispatches` & subcollection `items`: Staff and Admin can record and edit.
- `salaries`: Managed by Admin; attendance recorded by Staff/Admin.
- `expenses`: Managed by Staff/Admin; categories managed by Admin.
