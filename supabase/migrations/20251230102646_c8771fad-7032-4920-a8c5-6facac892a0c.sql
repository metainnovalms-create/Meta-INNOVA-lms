-- Create inventory_items table
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  sl_no SERIAL,
  name TEXT NOT NULL,
  description TEXT,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  units INTEGER NOT NULL DEFAULT 0,
  total_value NUMERIC GENERATED ALWAYS AS (unit_price * units) STORED,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disposed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create purchase_approval_chain table (CEO assigns who approves after institution)
CREATE TABLE public.purchase_approval_chain (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  approver_user_id UUID NOT NULL REFERENCES auth.users(id),
  approver_type TEXT NOT NULL CHECK (approver_type IN ('ceo', 'position')),
  position_id UUID REFERENCES public.positions(id),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(institution_id, approver_user_id)
);

-- Create purchase_requests table
CREATE TABLE public.purchase_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_code TEXT NOT NULL UNIQUE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  officer_id UUID NOT NULL REFERENCES public.officers(id),
  requester_name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total_estimated_cost NUMERIC NOT NULL DEFAULT 0,
  justification TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent')),
  status TEXT DEFAULT 'pending_institution' CHECK (status IN ('pending_institution', 'approved_institution', 'pending_ceo', 'approved', 'rejected', 'cancelled')),
  institution_approved_by UUID REFERENCES auth.users(id),
  institution_approved_at TIMESTAMP WITH TIME ZONE,
  institution_comments TEXT,
  final_approved_by UUID REFERENCES auth.users(id),
  final_approved_at TIMESTAMP WITH TIME ZONE,
  final_comments TEXT,
  rejected_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create inventory_issues table
CREATE TABLE public.inventory_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_code TEXT NOT NULL UNIQUE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  reported_by UUID NOT NULL REFERENCES public.officers(id),
  reporter_name TEXT NOT NULL,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('damaged', 'missing', 'malfunction', 'other')),
  description TEXT NOT NULL,
  quantity_affected INTEGER DEFAULT 1,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'acknowledged', 'in_progress', 'resolved', 'closed')),
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_inventory_items_institution ON public.inventory_items(institution_id);
CREATE INDEX idx_inventory_items_status ON public.inventory_items(status);
CREATE INDEX idx_purchase_requests_institution ON public.purchase_requests(institution_id);
CREATE INDEX idx_purchase_requests_status ON public.purchase_requests(status);
CREATE INDEX idx_purchase_requests_officer ON public.purchase_requests(officer_id);
CREATE INDEX idx_inventory_issues_institution ON public.inventory_issues(institution_id);
CREATE INDEX idx_inventory_issues_status ON public.inventory_issues(status);

-- Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_approval_chain ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_issues ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory_items
CREATE POLICY "Super admins can manage all inventory items"
ON public.inventory_items FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all inventory items"
ON public.inventory_items FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "CEO can manage all inventory items"
ON public.inventory_items FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_ceo = true));

CREATE POLICY "Position management can manage inventory if feature enabled"
ON public.inventory_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.positions pos ON pos.id = p.position_id
    WHERE p.id = auth.uid()
    AND pos.visible_features ? 'inventory_management'
  )
);

CREATE POLICY "Management can view own institution inventory"
ON public.inventory_items FOR SELECT
USING (
  has_role(auth.uid(), 'management'::app_role) 
  AND institution_id = get_user_institution_id(auth.uid())
);

CREATE POLICY "Officers can view assigned institution inventory"
ON public.inventory_items FOR SELECT
USING (
  has_role(auth.uid(), 'officer'::app_role)
  AND institution_id IN (
    SELECT unnest(assigned_institutions) FROM public.officers WHERE user_id = auth.uid()
  )
);

-- RLS Policies for purchase_approval_chain
CREATE POLICY "Super admins can manage approval chain"
ON public.purchase_approval_chain FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage approval chain"
ON public.purchase_approval_chain FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "CEO can manage approval chain"
ON public.purchase_approval_chain FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_ceo = true));

CREATE POLICY "Users can view approval chain"
ON public.purchase_approval_chain FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies for purchase_requests
CREATE POLICY "Super admins can manage all purchase requests"
ON public.purchase_requests FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all purchase requests"
ON public.purchase_requests FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "CEO can manage all purchase requests"
ON public.purchase_requests FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_ceo = true));

CREATE POLICY "Position management can manage purchase requests if feature enabled"
ON public.purchase_requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.positions pos ON pos.id = p.position_id
    WHERE p.id = auth.uid()
    AND pos.visible_features ? 'inventory_management'
  )
);

CREATE POLICY "Management can view and approve institution purchase requests"
ON public.purchase_requests FOR ALL
USING (
  has_role(auth.uid(), 'management'::app_role) 
  AND institution_id = get_user_institution_id(auth.uid())
);

CREATE POLICY "Officers can manage own purchase requests"
ON public.purchase_requests FOR ALL
USING (
  has_role(auth.uid(), 'officer'::app_role)
  AND officer_id IN (SELECT id FROM public.officers WHERE user_id = auth.uid())
);

CREATE POLICY "Assigned approvers can view and approve requests"
ON public.purchase_requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.purchase_approval_chain pac
    WHERE pac.institution_id = purchase_requests.institution_id
    AND pac.approver_user_id = auth.uid()
    AND pac.is_active = true
  )
);

-- RLS Policies for inventory_issues
CREATE POLICY "Super admins can manage all inventory issues"
ON public.inventory_issues FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all inventory issues"
ON public.inventory_issues FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "CEO can manage all inventory issues"
ON public.inventory_issues FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_ceo = true));

CREATE POLICY "Position management can manage issues if feature enabled"
ON public.inventory_issues FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.positions pos ON pos.id = p.position_id
    WHERE p.id = auth.uid()
    AND pos.visible_features ? 'inventory_management'
  )
);

CREATE POLICY "Management can view and manage institution issues"
ON public.inventory_issues FOR ALL
USING (
  has_role(auth.uid(), 'management'::app_role) 
  AND institution_id = get_user_institution_id(auth.uid())
);

CREATE POLICY "Officers can create and view own institution issues"
ON public.inventory_issues FOR ALL
USING (
  has_role(auth.uid(), 'officer'::app_role)
  AND (
    reported_by IN (SELECT id FROM public.officers WHERE user_id = auth.uid())
    OR institution_id IN (SELECT unnest(assigned_institutions) FROM public.officers WHERE user_id = auth.uid())
  )
);

-- Function to generate request codes
CREATE OR REPLACE FUNCTION public.generate_request_code(prefix TEXT, table_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year TEXT;
  v_count INTEGER;
  v_code TEXT;
BEGIN
  v_year := to_char(now(), 'YYYY');
  
  IF table_name = 'purchase_requests' THEN
    SELECT COUNT(*) + 1 INTO v_count FROM public.purchase_requests 
    WHERE request_code LIKE prefix || '-' || v_year || '-%';
  ELSIF table_name = 'inventory_issues' THEN
    SELECT COUNT(*) + 1 INTO v_count FROM public.inventory_issues 
    WHERE issue_code LIKE prefix || '-' || v_year || '-%';
  ELSE
    v_count := 1;
  END IF;
  
  v_code := prefix || '-' || v_year || '-' || lpad(v_count::TEXT, 4, '0');
  RETURN v_code;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_requests_updated_at
BEFORE UPDATE ON public.purchase_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_issues_updated_at
BEFORE UPDATE ON public.inventory_issues
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();