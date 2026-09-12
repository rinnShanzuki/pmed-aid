import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../hooks/useAuth';

interface DashboardHeaderProps {
  title: string;
  brandColor: string;
}

export default function DashboardHeader({ title, brandColor }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    setShowMenu(false);
    await logout();
  };

  return (
    <>
      <View style={styles.topHeader}>
        <View style={styles.brandContainer}>
          <View style={[styles.brandIcon, { backgroundColor: brandColor }]}>
            <Text style={styles.brandPlus}>+</Text>
          </View>
          <Text style={styles.brandText}>PMed-Aid</Text>
        </View>
        <Text style={styles.pageTitle}>{title}</Text>
        <TouchableOpacity onPress={() => setShowMenu(!showMenu)} activeOpacity={0.7}>
          <View style={[styles.userAvatar, { backgroundColor: brandColor }]}>
            <Text style={styles.userInitials}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          <TouchableOpacity 
            style={styles.overlay} 
            activeOpacity={1} 
            onPress={() => setShowMenu(false)}
          />
          <View style={styles.dropdownMenu}>
            <View style={styles.menuHeader}>
              <View style={[styles.menuAvatarLarge, { backgroundColor: brandColor }]}>
                <Text style={styles.menuAvatarText}>
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </Text>
              </View>
              <Text style={styles.menuName}>
                {user?.first_name} {user?.last_name}
              </Text>
              <Text style={styles.menuRole}>{user?.role?.replace('_', ' ')}</Text>
            </View>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={() => setShowMenu(false)}>
              <Text style={styles.menuIcon}>👤</Text>
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => setShowMenu(false)}>
              <Text style={styles.menuIcon}>⚙️</Text>
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Text style={styles.menuIcon}>🚪</Text>
              <Text style={[styles.menuText, { color: '#ef4444' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandPlus: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  brandText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  pageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitials: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 90,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  menuHeader: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  menuAvatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  menuName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  menuRole: {
    fontSize: 13,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0f172a',
  },
});
