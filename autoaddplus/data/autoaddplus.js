/**
 * Script: autoaddplus.js
 *      The client-side javascript code for the AutoAddPlus plugin.
 *
 * Copyright (C) 2009 GazpachoKing <chase.sterling@gmail.com>
 *
 * This file is part of Deluge and is licensed under GNU General Public License 3.0, or later, with
 * the additional special exception to link portions of this program with the OpenSSL library.
 * See LICENSE for more details.
 */

Ext.ns('Deluge.ux.AutoAddPlus');
Deluge.ux.AutoAddPlus.onClickFunctions = {};

Ext.ns('Deluge.ux.preferences');

/**
 * @class Deluge.ux.preferences.AutoAddPlusPage
 * @extends Ext.Panel
 */
Deluge.ux.preferences.AutoAddPlusPage = Ext.extend(Ext.Panel, {
    title: _('AutoAddPlus'),
    header: false,
    layout: 'fit',
    border: false,
    watchdirs: {},

    initComponent: function() {
        Deluge.ux.preferences.AutoAddPlusPage.superclass.initComponent.call(this);

        var autoAddPlus = this;

        this.list = new Ext.list.ListView({
            store: new Ext.data.JsonStore({
                fields: ['id', 'enabled', 'owner', 'path'],
            }),
            columns: [
                {
                    id: 'enabled',
                    header: _('Active'),
                    sortable: true,
                    dataIndex: 'enabled',
                    tpl: new Ext.XTemplate('{enabled:this.getCheckbox}', {
                        getCheckbox: function(checked, selected) {
                            Deluge.ux.AutoAddPlus.onClickFunctions[
                                selected.id
                            ] = function() {
                                if (selected.enabled) {
                                    deluge.client.autoaddplus.disable_watchdir(
                                        selected.id
                                    );
                                    checked = false;
                                } else {
                                    deluge.client.autoaddplus.enable_watchdir(
                                        selected.id
                                    );
                                    checked = true;
                                }
                                autoAddPlus.updateWatchDirs();
                            };
                            return (
                                '<input id="enabled-' +
                                selected.id +
                                '" type="checkbox"' +
                                (checked ? ' checked' : '') +
                                ' onclick="Deluge.ux.AutoAddPlus.onClickFunctions[' +
                                selected.id +
                                ']()" />'
                            );
                        },
                    }),
                    width: 0.15,
                },
                {
                    id: 'owner',
                    header: _('Owner'),
                    sortable: true,
                    dataIndex: 'owner',
                    width: 0.2,
                },
                {
                    id: 'path',
                    header: _('Path'),
                    sortable: true,
                    dataIndex: 'path',
                },
            ],
            singleSelect: true,
            autoExpandColumn: 'path',
        });
        this.list.on('selectionchange', this.onSelectionChange, this);

        this.panel = this.add({
            items: [this.list],
            bbar: {
                items: [
                    {
                        text: _('Add'),
                        iconCls: 'icon-add',
                        handler: this.onAddClick,
                        scope: this,
                    },
                    {
                        text: _('Edit'),
                        iconCls: 'icon-edit',
                        handler: this.onEditClick,
                        scope: this,
                        disabled: true,
                    },
                    '->',
                    {
                        text: _('Remove'),
                        iconCls: 'icon-remove',
                        handler: this.onRemoveClick,
                        scope: this,
                        disabled: true,
                    },
                ],
            },
        });

        this.on('show', this.onPreferencesShow, this);
    },

    updateWatchDirs: function() {
        deluge.client.autoaddplus.get_watchdirs({
            success: function(watchdirs) {
                this.watchdirs = watchdirs;
                var watchdirsArray = [];
                for (var id in watchdirs) {
                    if (watchdirs.hasOwnProperty(id)) {
                        var watchdir = {};
                        watchdir['id'] = id;
                        watchdir['enabled'] = watchdirs[id].enabled;
                        watchdir['owner'] =
                            watchdirs[id].owner || 'localclient';
                        watchdir['path'] = watchdirs[id].path;

                        watchdirsArray.push(watchdir);
                    }
                }
                this.list.getStore().loadData(watchdirsArray);
            },
            scope: this,
        });
    },

    onAddClick: function() {
        if (!this.addWin) {
            this.addWin = new Deluge.ux.AutoAddPlus.AddAutoAddPlusCommandWindow();
            this.addWin.on(
                'watchdiradd',
                function() {
                    this.updateWatchDirs();
                },
                this
            );
        }
        this.addWin.show();
    },

    onEditClick: function() {
        if (!this.editWin) {
            this.editWin = new Deluge.ux.AutoAddPlus.EditAutoAddPlusCommandWindow();
            this.editWin.on(
                'watchdiredit',
                function() {
                    this.updateWatchDirs();
                },
                this
            );
        }
        var id = this.list.getSelectedRecords()[0].id;
        this.editWin.show(id, this.watchdirs[id]);
    },

    onPreferencesShow: function() {
        this.updateWatchDirs();
    },

    onRemoveClick: function() {
        var record = this.list.getSelectedRecords()[0];
        deluge.client.autoaddplus.remove(record.id, {
            success: function() {
                this.updateWatchDirs();
            },
            scope: this,
        });
    },

    onSelectionChange: function(dv, selections) {
        if (selections.length) {
            this.panel
                .getBottomToolbar()
                .items.get(1)
                .enable();
            this.panel
                .getBottomToolbar()
                .items.get(3)
                .enable();
        } else {
            this.panel
                .getBottomToolbar()
                .items.get(1)
                .disable();
            this.panel
                .getBottomToolbar()
                .items.get(3)
                .disable();
        }
    },
});

Deluge.plugins.AutoAddPlusPlugin = Ext.extend(Deluge.Plugin, {
    name: 'AutoAddPlus',

    static: {
        prefsPage: null,
    },

    onDisable: function() {
        deluge.preferences.removePage(Deluge.plugins.AutoAddPlusPlugin.prefsPage);
        Deluge.plugins.AutoAddPlusPlugin.prefsPage = null;
    },

    onEnable: function() {
        /*
         * Called for each of the JavaScript files.
         * This will prevent adding unnecessary tabs to the preferences window.
         */
        if (!Deluge.plugins.AutoAddPlusPlugin.prefsPage) {
            Deluge.plugins.AutoAddPlusPlugin.prefsPage = deluge.preferences.addPage(
                new Deluge.ux.preferences.AutoAddPlusPage()
            );
        }
    },
});

Deluge.registerPlugin('AutoAddPlus', Deluge.plugins.AutoAddPlusPlugin);
