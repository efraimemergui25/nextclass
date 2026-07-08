# NEXTCLASS — MASTER SPECIFICATION

## Read this ENTIRE file before every session. Every decision. Every line of code.
## This is the source of truth for NextClass. Do not confuse with Unitravel.

---

## THE VISION
A premium, B2B e-commerce platform built with React, Vite, and Tailwind CSS. The design system follows an "Apple-style" glassmorphic look with highly polished, high-fidelity UI components.

---

## PROJECT STATE & ARCHITECTURE
- **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion.
- **Database / CMS**: Firebase Firestore. Site settings, marketing copy, and inventory are managed dynamically via a central administrative dashboard and synchronized in real-time.
- **Authentication**: Firebase Authentication. The admin panel is protected by a PIN-based authentication system.
- **Key Modules**:
  1. **E-Commerce Frontend**: Catalog, Cart Drawer, Wishlist, product customization, and details.
  2. **Admin Dashboard**: Orders, inventory, customer management, analytics, and CMS configuration.
  3. **Global Context**: State management and Firestore synchronization via React Context (`SettingsContext`, `AuthContext`, etc.).

---

## CORE DEVELOPMENT RULES
1. **Strict Context Boundaries**: This agent session belongs ONLY to the `nextclass` project located at `/Users/efraimmac/nextclass`. Never read, write, or execute commands in `unitravel` or any other external directory.
2. **Aesthetic Quality**: Every component must follow the premium "Apple-style" design. Use smooth glassmorphic cards (`backdrop-filter`), vibrant CSS gradients, and spring-based Framer Motion transitions.
3. **No Placeholders**: Never write mock functions or random generators (`Math.random()`) for production features. Integrate directly with Firebase/Firestore.
4. **i18n & Accessibility**: Ensure WCAG 2.1 AA compliance where applicable (e.g., accessible widget, keyboard navigation).

---

## BUILD COMMANDS & SCRIPTS
- Run local dev server: `npm run dev`
- Build production bundle: `npm run build`
- Lint code: `npm run lint`
