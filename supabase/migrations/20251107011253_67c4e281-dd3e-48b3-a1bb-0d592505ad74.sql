-- Auto-add creator as admin when creating a group
CREATE OR REPLACE FUNCTION auto_add_group_creator()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_auto_add_group_creator
AFTER INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION auto_add_group_creator();

-- Auto-add creator as attendee when creating an event
CREATE OR REPLACE FUNCTION auto_add_event_creator()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.event_attendees (event_id, user_id)
  VALUES (NEW.id, NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_auto_add_event_creator
AFTER INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION auto_add_event_creator();