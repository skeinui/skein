---
"@skeinui/ui": patch
---

SideMenu (and AdminLayout's menu): with a controlled `selectedKey` the selected item's submenus now start open, as documented, and open when the selection moves into closed ones (selected from a tab or a link, or items that arrive later); a submenu the user closes stays closed while the selection stays. Controlled `openKeys` are left alone.
