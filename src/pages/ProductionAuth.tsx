
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProductionAuthFlow from '@/components/ProductionAuthFlow';
import { PageLoader } from '@/components/LoadingStates';

const ProductionAuth = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return <ProductionAuthFlow />;
};

export default ProductionAuth;
