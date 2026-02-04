import React from 'react'
import LinkItem from './LinkItem'
import Pagination from '../general/Pagination'

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
                                              onEdited,
                                              page,
                                              setPage,
                                              size,
                                              total
                                          }) {
    return (
        <div>
            <section className="mb-3 tw-searchbar p-2 rounded">
                <ul className="list-none p-0 tw-divide-y tw-list">
                    {(links || []).map(link => (
                        <LinkItem
                            key={link.id}
                            link={link}
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

            <Pagination
                page={page}
                size={size}
                total={total}
                onPageChange={setPage}
            />
        </div>
    )
}
