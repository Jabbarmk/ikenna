import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Field, Select, Textarea } from './ui';

export default function TermsPicker({ appliesTo, templateId, text, onChange, autoApplyDefault }) {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    api.get('/terms-templates', { applies_to: appliesTo }).then((rows) => {
      setTemplates(rows);
      if (autoApplyDefault && !templateId && !text) {
        const def = rows.find((t) => t.is_default);
        if (def) onChange({ terms_template_id: def.id, terms_text: def.body });
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliesTo]);

  function handleTemplateChange(e) {
    const id = e.target.value ? Number(e.target.value) : null;
    const template = templates.find((t) => t.id === id);
    onChange({ terms_template_id: id, terms_text: template ? template.body : '' });
  }

  return (
    <>
      <Field label="Terms &amp; Conditions Template">
        <Select value={templateId || ''} onChange={handleTemplateChange}>
          <option value="">— None / custom —</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}{t.is_default ? ' (default)' : ''}</option>
          ))}
        </Select>
      </Field>
      <Field label="Terms Text" full>
        <Textarea
          rows={4}
          value={text || ''}
          onChange={(e) => onChange({ terms_template_id: templateId, terms_text: e.target.value })}
          placeholder="Select a template above or type custom terms for this document…"
        />
      </Field>
    </>
  );
}
