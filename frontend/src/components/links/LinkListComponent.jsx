import React from 'react'
import LinkItem from './LinkItem'

export default function LinkListComponent({
                                              links,
                                              tagInputs,
                                              setTagInputs,
                                              tagOptions,
                                              fetchTagOptions,
                                              onRemoveTag,
                                              onAddTag,
                                              onUpdateStatus,
                                              onAssignNext,
                                              onDelete,
                                              onEdited
                                          }) {
    return (
        <section className="mb-3 tw-searchbar p-2 rounded">
            <ul className="list-none p-0 tw-divide-y tw-list">
                {(links || []).map(l => (
                    <LinkItem
                        key={l.id}
                        link={l}
                        tagInputs={tagInputs}
                        setTagInputs={setTagInputs}
                        tagOptions={tagOptions}
                        fetchTagOptions={fetchTagOptions}
                        onRemoveTag={onRemoveTag}
                        onAddTag={onAddTag}
                        onUpdateStatus={onUpdateStatus}
                        onAssignNext={onAssignNext}
                        onDelete={onDelete}
                        onEdited={onEdited}
                    />
                ))}
            </ul>
        </section>
    )
}
