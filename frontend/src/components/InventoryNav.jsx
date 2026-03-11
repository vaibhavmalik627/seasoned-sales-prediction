import { NavLink } from "react-router-dom";

function InventoryNav() {
  return (
    <div className="inventory-tabs" aria-label="Inventory views">
      <NavLink to="/reorder" className={({ isActive }) => (isActive ? "active" : "")}>
        Reorder
      </NavLink>
      <NavLink to="/risk" className={({ isActive }) => (isActive ? "active" : "")}>
        Risk
      </NavLink>
    </div>
  );
}

export default InventoryNav;
