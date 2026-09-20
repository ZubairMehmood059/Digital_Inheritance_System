/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║              DESIGN PATTERNS — CENTRAL INDEX                        ║
 * ║  myDigitalVault — Digital Legacy System                             ║
 * ╠══════════════════════════════════════════════════════════════════════╣
 * ║                                                                      ║
 * ║  PATTERN 1: SINGLETON — FirebaseService                             ║
 * ║  File    : patterns/singleton/FirebaseService.js                    ║
 * ║  Applied : NetWorth.jsx, MedicalPassport.jsx                        ║
 * ║  Purpose : Ensures only one Firebase app/auth/db instance exists.   ║
 * ║            Multiple imports always return the same object.          ║
 * ║                                                                      ║
 * ║  PATTERN 2: FACTORY — PageFactory                                   ║
 * ║  File    : patterns/factory/PageFactory.jsx                         ║
 * ║  Applied : NetWorth.jsx, MedicalPassport.jsx                        ║
 * ║  Purpose : Creates page headers, loading states, and empty states   ║
 * ║            via static factory methods. Eliminates 15 copies of the  ║
 * ║            same header JSX scattered across every page.             ║
 * ║                                                                      ║
 * ║  PATTERN 3: BUILDER — InheritancePlanBuilder                        ║
 * ║  File    : patterns/builder/InheritancePlanBuilder.js               ║
 * ║  Applied : Inheritance.jsx handleSave()                             ║
 * ║  Purpose : Constructs InheritancePlan objects step-by-step with a   ║
 * ║            fluent API. Validates required fields and % totals       ║
 * ║            before the object is sent to Firestore.                  ║
 * ║                                                                      ║
 * ║  PATTERN 4: ADAPTER — NotificationAdapter                           ║
 * ║  File    : patterns/adapter/NotificationAdapter.js                  ║
 * ║  Applied : UdhaarManager.jsx, BillManager.jsx                       ║
 * ║  Purpose : Adapts incompatible notification systems (Browser API    ║
 * ║            vs React in-app Toast) into a single unified interface.  ║
 * ║            Pages call adapter.notify() — the adapter routes it.     ║
 * ║                                                                      ║
 * ║  PATTERN 5: BRIDGE — ThemeBridge                                    ║
 * ║  File    : patterns/bridge/ThemeBridge.js                           ║
 * ║  Applied : App_updated.jsx (switchTheme on toggle)                  ║
 * ║  Purpose : Separates theme abstraction (token names like "bg-card") ║
 * ║            from implementation (CSS vars vs hardcoded hex values).  ║
 * ║            Engine can be swapped at runtime without changing UI.    ║
 * ║                                                                      ║
 * ║  PATTERN 6: COMPOSITE — SidebarComposite / NavTree                  ║
 * ║  File    : patterns/composite/SidebarComposite.jsx                  ║
 * ║  Applied : Sidebar.jsx                                               ║
 * ║  Purpose : Treats NavItem (leaf) and NavGroup (composite) uniformly ║
 * ║            via the same render() interface. The full sidebar nav    ║
 * ║            is a tree built from these composable components.        ║
 * ║            Adding a page = one .add(new NavItem(...)) call.         ║
 * ║                                                                      ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

export { default as firebaseService } from "./singleton/FirebaseService";
export { default as PageFactory }     from "./factory/PageFactory";
export { default as InheritancePlanBuilder } from "./builder/InheritancePlanBuilder";
export { default as notificationAdapter }    from "./adapter/NotificationAdapter";
export { default as themeBridge, switchTheme } from "./bridge/ThemeBridge";
export { default as navTree, NavItem, NavGroup, NavTree } from "./composite/SidebarComposite";
