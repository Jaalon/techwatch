import React, { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import { listMistralModels as apiListMistralModels, createConfig as apiCreateConfig, updateConfig as apiUpdateConfig } from '../../api/llm'
import { getKey as apiGetKey } from '../../api/aikeys'

export default function AddMistralProviderModal({ isOpen, onRequestClose, onSaved, initialValues, selectedKeyId, selectedKeyName, keys = [] }) {
    // Normalize a Mistral base URL so that UI never shows '/v1' and fetch/save logic can append it exactly once
    const [name, setName] = useState('')
    const [models, setModels] = useState([]) // from Mistral: array of objects with id,name
    const [modelsLoading, setModelsLoading] = useState(false)
    const [modelsError, setModelsError] = useState('')
    const [selectedModelId, setSelectedModelId] = useState('')
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState('')

    const [resolvedKey, setResolvedKey] = useState(null)
    const [keyLoading, setKeyLoading] = useState(false)
    const [localKeyId, setLocalKeyId] = useState('')
    const [isEditingKey, setIsEditingKey] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        const iv = initialValues || {}
        setName(iv.name || '')
        setModels([])
        setSelectedModelId(iv.model || '')
        setModelsError('')
        setModelsLoading(false)
        setSaving(false)
        setSaveError('')
        setResolvedKey(null)
        setKeyLoading(false)
        setIsEditingKey(false)
        setLocalKeyId(String(selectedKeyId || ''))
    }, [isOpen, initialValues, selectedKeyId])

    // Resolve full key when selection changes
    useEffect(() => {
        const keyId = localKeyId || selectedKeyId
        if (!isOpen || !keyId) { setResolvedKey(null); return }
        let aborted = false
        const fetchKey = async () => {
            try {
                setKeyLoading(true)
                const full = await apiGetKey(keyId)
                if (aborted) return
                setResolvedKey(full || null)
            } catch (e) {
                if (aborted) return
                console.error(e)
                setResolvedKey(null)
            } finally {
                if (!aborted) setKeyLoading(false)
            }
        }
        fetchKey()
        return () => { aborted = true }
    }, [isOpen, localKeyId, selectedKeyId])

    useEffect(() => {
        const keyId = localKeyId || selectedKeyId
        const canFetch = !!keyId
        if (!isOpen || !canFetch) return
        let aborted = false
        const fetchModels = async () => {
            try {
                setModelsLoading(true)
                setModelsError('')
                const data = await apiListMistralModels(Number(keyId))
                if (aborted) return
                const items = Array.isArray(data) ? data : []
                setModels(items)
                if (items.length === 1) {
                    const only = items[0]
                    setSelectedModelId(only.id || '')
                    if (!name) setName(only.name || only.id || '')
                }
            } catch (e) {
                if (aborted) return
                setModels([])
                setSelectedModelId('')
                setModelsError(e?.message || 'Failed to load models')
            } finally {
                if (!aborted) setModelsLoading(false)
            }
        }
        fetchModels()
        return () => { aborted = true }
    }, [isOpen, localKeyId, selectedKeyId])

    const canSave = !!name && !!(localKeyId || selectedKeyId) && !!selectedModelId

    const onSave = async () => {
        if (!canSave || saving) return
        setSaving(true)
        setSaveError('')
        try {
            const keyId = localKeyId || selectedKeyId
            const payload = { name, aiApiKeyId: Number(keyId), model: selectedModelId }
            if (initialValues && initialValues.id) {
                await apiUpdateConfig(initialValues.id, payload)
            } else {
                await apiCreateConfig(payload)
            }
            try { onSaved && onSaved() } catch {}
            onRequestClose?.()
        } catch (e) {
            setSaveError(e?.message || 'Save failed')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            title="Add Mistral provider"
            initialSize={{ w: 600, h: 420 }}
            draggable={true}
            resizable={false}
            footerContent={
                <div className="flex justify-end gap-2">
                    <button className="tw-btn" onClick={onRequestClose} disabled={saving}>Cancel</button>
                    <button className="tw-btn" onClick={onSave} disabled={!canSave || saving}>{saving ? 'Saving…' : 'Save'}</button>
                </div>
            }
        >
            <div className="tw-modal-surface p-3">
                {saveError && <div className="tw-error mb-2">{saveError}</div>}
                <div className="grid grid-cols-1 gap-3">
                    <div>
                        <label className="block text-sm mb-1">Name</label>
                        <input className="tw-input w-full" value={name} onChange={e => setName(e.target.value)} placeholder="My Mistral" />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 tw-text-muted">Clé d'API</label>
                        {!isEditingKey ? (
                            <div
                                className="tw-input w-full bg-gray-100 dark:bg-gray-800 cursor-default select-none"
                                title="Double-cliquer pour changer"
                                onDoubleClick={() => setIsEditingKey(true)}
                            >
                                {keyLoading ? 'Chargement…' : ((() => { const k = keys.find(x => String(x.id) === String(localKeyId || selectedKeyId)); return (k?.name || selectedKeyName || '—') })())}
                            </div>
                        ) : (
                            <select
                                className="tw-select w-full"
                                value={localKeyId || ''}
                                onChange={e => setLocalKeyId(e.target.value)}
                                onBlur={() => setIsEditingKey(false)}
                            >
                                <option value="">-- Choisir une clé --</option>
                                {keys.map(k => (
                                    <option key={k.id} value={k.id}>{k.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {(!!resolvedKey?.baseUrl && !!resolvedKey?.apiKey) && (
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm">Modèle</label>
                                {modelsLoading && <span className="text-xs tw-text-muted">Chargement…</span>}
                            </div>
                            {modelsError && <div className="tw-error mb-2">{modelsError}</div>}
                            {models.length > 0 ? (
                                <select
                                    className="tw-select w-full"
                                    value={selectedModelId}
                                    onChange={e => {
                                        const id = e.target.value
                                        setSelectedModelId(id)
                                        if (!name) {
                                            const m = models.find(x => String(x.id) === String(id))
                                            const display = (m && (m.name || m.id)) || id
                                            setName(display)
                                        }
                                    }}
                                >
                                    <option value="">-- Sélectionner un modèle --</option>
                                    {models.map(m => (
                                        <option key={m.id} value={m.id}>{m.name || m.id}</option>
                                    ))}
                                </select>
                            ) : (!modelsLoading && !modelsError ? (
                                <div className="tw-text-muted text-sm">Sélectionnez une clé valide pour charger les modèles.</div>
                            ) : null)}
                        </div>
                    )}

                </div>
            </div>
        </Modal>
    )
}
