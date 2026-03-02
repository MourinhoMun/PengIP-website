'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, Globe, LogOut, Settings, Coins, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/app/i18n';
import { useAuth } from '@/app/contexts/AuthContext';
import { useBrand } from '@/app/hooks/useBrand';
import styles from './Navbar.module.scss';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { t, toggleLanguage } = useLanguage();
  const { user, logout, loading } = useAuth();
  const brand = useBrand();
  const pathname = usePathname();
  const isHome = pathname === '/';
  const anchor = (id: string) => isHome ? `#${id}` : `/#${id}`;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: t.nav.tools, href: anchor('tools') },
    ...(!brand.isYimei ? [{ label: t.nav.about, href: '/about' }] : []),
    { label: t.nav.contact, href: anchor('contact') },
  ];
  const pricingLabel = t.nav.pricing;

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  const handleMobileNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!isHome) return; // 非首页直接跳转，不拦截
    e.preventDefault();
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      const id = href.replace('#', '');
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  };

  return (
    <motion.nav
      className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className={styles.container}>
        {/* Logo */}
        <a href="/" className={styles.logo}>
          <span className={styles.logoText}>{brand.name}</span>
        </a>

        {/* Desktop Navigation */}
        <div className={styles.desktopNav}>
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={styles.navLink}
              onClick={(e) => {
                if (item.href.startsWith('#') || item.href.startsWith('/#')) return;
                e.preventDefault();
                window.location.href = item.href;
              }}
            >
              {item.label}
            </a>
          ))}
          <Link href="/pricing" className={`${styles.navLink} ${styles.pricingLink}`}>
            {pricingLabel}
          </Link>
        </div>

        {/* Right side: Lang + Auth */}
        <div className={styles.rightSection}>
          {/* Language Toggle */}
          <button className={styles.langBtn} onClick={toggleLanguage}>
            <Globe size={16} />
            <span>{t.nav.switchLang}</span>
          </button>

          {/* Auth Buttons */}
          {!loading && (
            <>
              {user ? (
                <div className={styles.userMenuWrapper}>
                  <button 
                    className={styles.userBtn}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <User size={18} />
                    <span className={styles.userName}>{user.name || user.email}</span>
                    <span className={styles.userPoints}>
                      <Coins size={14} />
                      {user.points}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div className={styles.userMenu}>
                      <div className={styles.menuHeader}>
                        <span className={styles.menuEmail}>{user.email || user.phone}</span>
                        <span className={styles.menuPoints}>{user.points} 积分</span>
                      </div>
                      <Link href="/dashboard" className={styles.menuItem} onClick={() => setShowUserMenu(false)}>
                        <Coins size={16} />
                        用户中心
                      </Link>
                      <Link href="/dashboard#recharge" className={styles.menuItem} onClick={() => setShowUserMenu(false)}>
                        <PlusCircle size={16} />
                        充值积分
                      </Link>
                      {user.role === 'admin' && (
                        <Link href="/admin" className={styles.menuItem} onClick={() => setShowUserMenu(false)}>
                          <Settings size={16} />
                          管理后台
                        </Link>
                      )}
                      <button onClick={handleLogout} className={styles.menuItem}>
                        <LogOut size={16} />
                        退出登录
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.authButtons}>
                  <Link href="/login" className={styles.loginBtn}>
                    <User size={16} />
                    {t.nav.login}
                  </Link>
                  <Link href="/register" className={styles.registerBtn}>
                    {t.nav.register}
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className={styles.mobileMenuBtn}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className={styles.mobileMenu}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            {navItems.map((item, index) => (
              <motion.a
                key={item.href}
                href={item.href}
                className={styles.mobileNavLink}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={(e) => handleMobileNavClick(e, item.href)}
              >
                {item.label}
              </motion.a>
            ))}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: navItems.length * 0.05 }}
            >
              <Link
                href="/pricing"
                className={`${styles.mobileNavLink} ${styles.pricingMobileLink}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {pricingLabel}
              </Link>
            </motion.div>
            <div className={styles.mobileAuthButtons}>
              <button className={styles.langBtn} onClick={toggleLanguage}>
                <Globe size={16} />
                <span>{t.nav.switchLang}</span>
              </button>
              {user ? (
                <>
                  <div className={styles.mobileUserInfo}>
                    <span>{user.email || user.phone}</span>
                    <span className={styles.userPoints}>
                      <Coins size={14} />
                      {user.points} 积分
                    </span>
                  </div>
                  <Link href="/dashboard" className={styles.loginBtn} onClick={() => setIsMobileMenuOpen(false)}>
                    <Coins size={16} />
                    用户中心
                  </Link>
                  <Link href="/dashboard#recharge" className={styles.loginBtn} onClick={() => setIsMobileMenuOpen(false)}>
                    <PlusCircle size={16} />
                    充值积分
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className={styles.loginBtn} onClick={() => setIsMobileMenuOpen(false)}>
                      <Settings size={16} />
                      管理后台
                    </Link>
                  )}
                  <button onClick={handleLogout} className={styles.loginBtn}>
                    <LogOut size={16} />
                    退出登录
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className={styles.loginBtn}>
                    <User size={16} />
                    {t.nav.login}
                  </Link>
                  <Link href="/register" className={styles.registerBtn}>
                    {t.nav.register}
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
