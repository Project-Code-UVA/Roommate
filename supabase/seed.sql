-- Seed: 51 well-known US universities across diverse regions
INSERT INTO public.schools (name) VALUES
-- Northeast
('Harvard University'),
('Massachusetts Institute of Technology'),
('Yale University'),
('Columbia University'),
('Princeton University'),
('Brown University'),
('University of Pennsylvania'),
('Cornell University'),
('Boston University'),
('Northeastern University'),
('New York University'),
('Rutgers University'),
('Penn State University'),
('University of Connecticut'),
('Syracuse University'),
-- Southeast
('Duke University'),
('University of Virginia'),
('University of North Carolina at Chapel Hill'),
('University of Florida'),
('University of Georgia'),
('Florida State University'),
('University of Miami'),
('Vanderbilt University'),
('Emory University'),
('Georgia Institute of Technology'),
-- Midwest
('University of Michigan'),
('University of Wisconsin-Madison'),
('Ohio State University'),
('University of Illinois Urbana-Champaign'),
('Northwestern University'),
('University of Chicago'),
('University of Minnesota'),
('Indiana University Bloomington'),
('Purdue University'),
('Michigan State University'),
-- Southwest
('University of Texas at Austin'),
('Texas A&M University'),
('Rice University'),
('Arizona State University'),
('University of Arizona'),
('University of Oklahoma'),
('University of Colorado Boulder'),
('Baylor University'),
-- West Coast
('Stanford University'),
('University of California, Berkeley'),
('University of California, Los Angeles'),
('University of Southern California'),
('University of Washington'),
('Oregon State University'),
('University of California, San Diego'),
('California Institute of Technology')
ON CONFLICT (name) DO NOTHING;

-- Seed: PRD ranking weights
INSERT INTO public.ranking_config (weight_name, weight_value) VALUES
('completeness', 0.3000),
('activity', 0.2500),
('verification', 0.2000),
('engagement', 0.1500),
('freshness', 0.1000)
ON CONFLICT (weight_name) DO NOTHING;
