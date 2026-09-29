-- Migration: Order Pipeline Enrichment (Events, Inventory Movements, Customers, Notifications)

CREATE OR REPLACE FUNCTION public.place_order(
  _company_slug text,
  _customer_name text,
  _customer_phone text,
  _customer_email text,
  _notes text,
  _items jsonb
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _company uuid;
  _order uuid;
  _item jsonb;
  _p public.products;
  _qty int;
  _unit numeric;
  _total numeric := 0;
  _existing_customer_id uuid;
BEGIN
  -- 1. Input Validation
  IF coalesce(trim(_customer_name),'') = '' OR length(_customer_name) > 120 THEN
    RAISE EXCEPTION 'Nome inválido';
  END IF;

  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 OR jsonb_array_length(_items) > 50 THEN
    RAISE EXCEPTION 'Carrinho inválido';
  END IF;

  SELECT id INTO _company FROM public.companies WHERE slug = _company_slug;
  IF _company IS NULL THEN
    RAISE EXCEPTION 'Loja não encontrada';
  END IF;

  -- 2. Create Order Record
  INSERT INTO public.orders (
    company_id,
    customer_name,
    customer_phone,
    customer_email,
    notes,
    status,
    payment_status,
    fulfillment_status
  )
  VALUES (
    _company,
    left(_customer_name, 120),
    left(_customer_phone, 40),
    left(_customer_email, 160),
    left(_notes, 1000),
    'pending',
    'pending',
    'unfulfilled'
  )
  RETURNING id INTO _order;

  -- 3. Process Items, Decrement Stock & Record Movements
  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _qty := (_item->>'quantity')::int;
    IF _qty IS NULL OR _qty < 1 OR _qty > 999 THEN
      RAISE EXCEPTION 'Quantidade inválida';
    END IF;

    SELECT * INTO _p FROM public.products
      WHERE id = (_item->>'product_id')::uuid AND company_id = _company AND active FOR UPDATE;

    IF _p.id IS NULL THEN
      RAISE EXCEPTION 'Produto indisponível';
    END IF;

    IF _p.stock < _qty THEN
      RAISE EXCEPTION 'Stock insuficiente para %', _p.name;
    END IF;

    _unit := coalesce(_p.promo_price, _p.price);

    -- Decrement stock
    UPDATE public.products SET stock = stock - _qty WHERE id = _p.id;

    -- Insert Order Item
    INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, quantity)
    VALUES (_order, _p.id, _p.name, _unit, _qty);

    -- Record Inventory Movement
    INSERT INTO public.inventory_movements (company_id, product_id, type, quantity, reason)
    VALUES (_company, _p.id, 'out', _qty, 'Pedido #' || upper(left(_order::text, 8)));

    _total := _total + (_unit * _qty);
  END LOOP;

  -- 4. Update Order Total
  UPDATE public.orders SET total = _total WHERE id = _order;

  -- 5. Record Order Timeline Event
  INSERT INTO public.order_events (company_id, order_id, type, actor_type, description, metadata)
  VALUES (
    _company,
    _order,
    'order.created',
    'customer',
    'Pedido #' || upper(left(_order::text, 8)) || ' criado com sucesso no website.',
    jsonb_build_object('total', _total, 'items_count', jsonb_array_length(_items))
  );

  -- 6. Upsert Customer Record
  SELECT id INTO _existing_customer_id FROM public.customers
    WHERE company_id = _company
      AND (
        (email IS NOT NULL AND lower(email) = lower(trim(_customer_email))) OR
        (phone IS NOT NULL AND phone = trim(_customer_phone)) OR
        (lower(name) = lower(trim(_customer_name)))
      )
    LIMIT 1;

  IF _existing_customer_id IS NOT NULL THEN
    UPDATE public.customers
    SET
      total_spent = total_spent + _total,
      orders_count = orders_count + 1,
      last_order_at = now(),
      updated_at = now()
    WHERE id = _existing_customer_id;
  ELSE
    INSERT INTO public.customers (
      company_id,
      name,
      email,
      phone,
      channel,
      total_spent,
      orders_count,
      last_order_at
    )
    VALUES (
      _company,
      left(trim(_customer_name), 120),
      nullif(trim(_customer_email), ''),
      nullif(trim(_customer_phone), ''),
      'website',
      _total,
      1,
      now()
    );
  END IF;

  -- 7. Record Admin Notification
  INSERT INTO public.notifications (company_id, type, title, message, link)
  VALUES (
    _company,
    'new_order',
    'Novo pedido recebido',
    _customer_name || ' efetuou o pedido #' || upper(left(_order::text, 8)) || ' no valor de ' || _total::text,
    '/admin/pedidos'
  );

  RETURN _order;
END; $$;
