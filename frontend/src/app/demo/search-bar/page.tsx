'use client'

import React, { useState } from 'react'
import SearchBar, { InputField, SearchFormData } from '@/components/MainPanel/SearchBar/SearchBar'

const SearchBarDemo: React.FC = () => {
    const [searchResults, setSearchResults] = useState<SearchFormData[]>([])
    const [selectedDemo, setSelectedDemo] = useState<string>('basic')

    // Basic demo - 3 fields (default: 3 per row)
    const basicFields: InputField[] = [
        {
            label: "Name",
            type: "text",
            typeOptions: {
                placeholder: "Enter full name"
            }
        },
        {
            label: "Age",
            type: "number",
            typeOptions: {
                min: 18,
                max: 100,
                step: 1,
                placeholder: "Enter age"
            }
        },
        {
            label: "Gender",
            type: "select",
            typeOptions: {
                options: [
                    { label: "Male", value: "male" },
                    { label: "Female", value: "female" },
                    { label: "Other", value: "other" }
                ],
                placeholder: "Select gender"
            }
        }
    ]

    // Row config demo - showcasing custom row layouts
    const rowConfigDemoFields: InputField[] = [
        {
            label: "First Name",
            type: "text",
            typeOptions: {
                placeholder: "Enter first name"
            },
            //width: "100%"
        },
        {
            label: "Last Name",
            type: "text",
            typeOptions: {
                placeholder: "Enter last name"
            },
            // width: "100%"
        },
        {
            label: "Age",
            type: "number",
            typeOptions: {
                min: 18,
                max: 100,
                step: 1,
                placeholder: "Enter age"
            },
            width: "150px"
        },
        {
            label: "Gender",
            type: "select",
            typeOptions: {
                options: [
                    { label: "Male", value: "male" },
                    { label: "Female", value: "female" },
                    { label: "Other", value: "other" }
                ],
                placeholder: "Select gender"
            },
            width: "120px"
        },
        {
            label: "Email",
            type: "text",
            typeOptions: {
                placeholder: "Enter email"
            },
            width: "70%"
        },
        {
            label: "Phone",
            type: "text",
            typeOptions: {
                placeholder: "Enter phone"
            },
            width: "28%"
        },
        {
            label: "Country",
            type: "select",
            typeOptions: {
                options: [
                    { label: "USA", value: "usa" },
                    { label: "UK", value: "uk" },
                    { label: "Canada", value: "canada" }
                ],
                placeholder: "Select country"
            },
            width: "150px"
        },
        {
            label: "City",
            type: "text",
            typeOptions: {
                placeholder: "Enter city"
            },
            width: "200px"
        },
        {
            label: "Profession",
            type: "select",
            typeOptions: {
                options: [
                    { label: "Actor", value: "actor" },
                    { label: "Actress", value: "actress" },
                    { label: "Director", value: "director" }
                ],
                placeholder: "Select profession"
            },
            width: "180px"
        }
    ]

    const handleSearch = (data: SearchFormData) => {
        console.log('Search data:', data)
        setSearchResults(prev => [data, ...prev.slice(0, 4)]) // Keep last 5 searches
    }

    const handleClear = () => {
        console.log('Form cleared')
        setSearchResults([])
    }

    const getCurrentFields = () => {
        switch (selectedDemo) {
            case 'basic':
                return basicFields
            case 'rowConfig':
                return rowConfigDemoFields
            case 'autoSearch':
                return rowConfigDemoFields
            default:
                return basicFields
        }
    }

    const getRowConfig = () => {
        switch (selectedDemo) {
            case 'rowConfig':
            case 'autoSearch':
                return [2, 2, 2] // 2 fields per row for first 3 rows, then default
            default:
                return undefined
        }
    }

    const getDemoInfo = () => {
        switch (selectedDemo) {
            case 'basic':
                return {
                    title: 'Basic Demo (3 fields)',
                    description: 'Default layout: 3 fields per row',
                    layout: 'Row 1: [3 fields]'
                }
            case 'rowConfig':
                return {
                    title: 'Row Config Demo (9 fields)',
                    description: 'Custom layout: [2, 2, 2] + default 3 per row',
                    layout: 'Row 1: [2 fields], Row 2: [2 fields], Row 3: [2 fields], Row 4: [3 fields]'
                }
            case 'autoSearch':
                return {
                    title: 'Auto-Search Demo (9 fields)',
                    description: 'No buttons, auto-triggers search on field changes',
                    layout: 'Row 1: [2 fields], Row 2: [2 fields], Row 3: [2 fields], Row 4: [3 fields]'
                }
            default:
                return { title: 'Basic Demo', description: '', layout: '' }
        }
    }

    const demoInfo = getDemoInfo()

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '20px', color: '#333' }}>SearchBar Component Demo</h1>

            {/* Demo Selection */}
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '10px' }}>Select Demo:</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <button
                        onClick={() => setSelectedDemo('basic')}
                        style={{
                            padding: '8px 16px',
                            border: selectedDemo === 'basic' ? '2px solid #007bff' : '1px solid #ccc',
                            borderRadius: '4px',
                            background: selectedDemo === 'basic' ? '#e3f2fd' : 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Basic (3 fields)
                    </button>
                    <button
                        onClick={() => setSelectedDemo('rowConfig')}
                        style={{
                            padding: '8px 16px',
                            border: selectedDemo === 'rowConfig' ? '2px solid #007bff' : '1px solid #ccc',
                            borderRadius: '4px',
                            background: selectedDemo === 'rowConfig' ? '#e3f2fd' : 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Row Config [2,2,2]
                    </button>
                    <button
                        onClick={() => setSelectedDemo('autoSearch')}
                        style={{
                            padding: '8px 16px',
                            border: selectedDemo === 'autoSearch' ? '2px solid #007bff' : '1px solid #ccc',
                            borderRadius: '4px',
                            background: selectedDemo === 'autoSearch' ? '#e3f2fd' : 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Auto-Search
                    </button>
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <p style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>
                        <strong>{demoInfo.title}</strong> - {demoInfo.description}
                    </p>
                    <p style={{ color: '#888', fontSize: '12px', margin: '5px 0', fontFamily: 'monospace' }}>
                        Layout: {demoInfo.layout}
                    </p>
                </div>
            </div>

            {/* SearchBar Component */}
            <div style={{ marginBottom: '30px' }}>
                <SearchBar
                    inputFields={getCurrentFields()}
                    onSearch={handleSearch}
                    onClear={handleClear}
                    rowConfig={getRowConfig()}
                    mode={selectedDemo === 'autoSearch' ? 'auto' : 'manual'}
                />
            </div>

            {/* Search Results */}
            <div>
                <h3 style={{ marginBottom: '15px' }}>Search Results:</h3>
                {searchResults.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>
                        No searches performed yet. Try filling out the form above and clicking Search.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {searchResults.map((result, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '15px',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '6px',
                                    background: '#f9f9f9'
                                }}
                            >
                                <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
                                    Search #{searchResults.length - index}
                                </h4>
                                <pre style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    )
}

export default SearchBarDemo
