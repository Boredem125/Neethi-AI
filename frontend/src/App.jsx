import { createContext, useContext, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TenderList from './pages/TenderList';
import TenderDetail from './pages/TenderDetail';
import CreateTender from './pages/CreateTender';
import ReviewQueue from './pages/ReviewQueue';
import AuditLog from './pages/AuditLog';

export const LangContext = createContext({ lang: 'EN', setLang: () => {} });
export const useLang = () => useContext(LangContext);

export default function App() {
  const [lang, setLang] = useState('EN');

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/tenders"   element={<TenderList />} />
            <Route path="/tenders/new" element={<CreateTender />} />
            <Route path="/tenders/:id" element={<TenderDetail />} />
            <Route path="/review"    element={<ReviewQueue />} />
            <Route path="/audit"     element={<AuditLog />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </LangContext.Provider>
  );
}
