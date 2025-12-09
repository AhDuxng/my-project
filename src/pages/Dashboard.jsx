/**
 * Dashboard Page
 * Trang tổng quan với thống kê tài liệu
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDocuments, getProductCategories } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    officialDocuments: 0,
    internalDocuments: 0,
    totalCategories: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const documents = getDocuments();
      const categories = await getProductCategories();

      const official = documents.filter(doc => doc.documentType === 'official').length;
      const internal = documents.filter(doc => doc.documentType === 'internal').length;

      setStats({
        totalDocuments: documents.length,
        officialDocuments: official,
        internalDocuments: internal,
        totalCategories: categories.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const statCards = [
    {
      title: 'Total Documents',
      value: stats.totalDocuments,
      icon: '📄',
      color: 'bg-blue-500',
      link: '/documents'
    },
    {
      title: 'Official Documents',
      value: stats.officialDocuments,
      icon: '📋',
      color: 'bg-green-500',
      link: '/documents?type=official'
    },
    {
      title: 'Internal Documents',
      value: stats.internalDocuments,
      icon: '📝',
      color: 'bg-purple-500',
      link: '/documents?type=internal'
    },
    {
      title: 'Product Categories',
      value: stats.totalCategories,
      icon: '📁',
      color: 'bg-orange-500',
      link: '/categories'
    }
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Link
            key={index}
            to={stat.link}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} rounded-full p-4`}>
                <span className="text-3xl">{stat.icon}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/documents/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            + Create New Document
          </Link>
          <Link
            to="/documents"
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300 transition-colors"
          >
            View All Documents
          </Link>
          <Link
            to="/categories"
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300 transition-colors"
          >
            Manage Categories
          </Link>
        </div>
      </div>

      {/* Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">📌 About This Application</h4>
        <p className="text-sm text-blue-800">
          This is a demo application for managing accounting and auditing documents.
          You can create, view, edit, and delete documents. Each document must be
          categorized by product category for better organization.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;

