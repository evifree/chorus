describe("chorus.dialogs.CreateExternalTableFromHdfs", function() {
    beforeEach(function() {
        setLoggedInUser({id: '54321'});
        chorus.page = {};
        chorus.page.workspace = rspecFixtures.workspace({
            sandboxInfo: {
                name: "mySchema",
                database: { name: "myDatabase", instance: { name: "myInstance" } }
            }
        });
        this.sandbox = chorus.page.workspace.sandbox();
        this.csvOptions = {
            contents: [
                "COL1,col2, col3 ,col 4,Col_5",
                "val1.1,val1.2,val1.3,val1.4,val1.5",
                "val2.1,val2.2,val2.3,val2.4,val2.5",
                "val3.1,val3.2,val3.3,val3.4,val3.5"
            ],
            tableName: 'hi'
        };

        this.model = new (chorus.models.Base.extend({
            constructorName: 'FakeModel',
            urlTemplate: "workspaces/{{workspaceId}}/external_tables"
        }))();

        this.model.set({
            hdfs_entry_id: '234'
        });

        this.dialog = new chorus.dialogs.CreateExternalTableFromHdfs({model: this.model, csvOptions: this.csvOptions});
        this.dialog.render();
    });

    it("does not include a header row", function() {
        expect(this.dialog.includeHeader).toBeFalsy();
    });

    it("fetches the list of workspaces for the logged in user", function() {
        var workspaces = new chorus.collections.WorkspaceSet([], {userId: "54321"});
        expect(workspaces).toHaveBeenFetched();
    });

    context("when the workspace fetch completes and there are no workspaces", function() {
        beforeEach(function() {
            this.server.completeFetchAllFor(new chorus.collections.WorkspaceSet([], {userId: "54321"}));
        });

        it("populates the dialog's errors div", function() {
            expect(this.dialog.$(".errors")).toContainTranslation("field_error.workspaces.EMPTY");
        });

        it("disables the submit button", function() {
            expect(this.dialog.$('button.submit')).toBeDisabled();
        });

    });

    context("when the workspace fetch completes and there are workspaces", function() {
        beforeEach(function() {
            spyOn(chorus, "styleSelect");
            this.workspace1 = rspecFixtures.workspace();
            this.workspace2 = rspecFixtures.workspace();
            this.workspace2.unset("sandboxInfo");
            this.workspace3 = rspecFixtures.workspace();
            this.server.completeFetchAllFor(new chorus.collections.WorkspaceSet([], {userId: "54321"}),
                [this.workspace1, this.workspace2, this.workspace3]);
        });

        it("has a select with the workspaces containing sandboxes as options", function() {
            expect(this.dialog.$(".directions option").length).toBe(2);
            expect(this.dialog.$(".directions option").eq(0).text()).toBe(this.workspace1.get("name"));
            expect(this.dialog.$(".directions option").eq(1).text()).toBe(this.workspace3.get("name"));

            expect(this.dialog.$(".directions option").eq(0).val()).toBe(this.workspace1.id);
            expect(this.dialog.$(".directions option").eq(1).val()).toBe(this.workspace3.id);
        });

        it("styles the select", function() {
            expect(chorus.styleSelect).toHaveBeenCalled();
        });

        it("has the right labels", function() {
            expect(this.dialog.title).toMatchTranslation("hdfs.create_external.title");
            expect(this.dialog.$("button.submit").text()).toMatchTranslation("hdfs.create_external.ok");
        });

        context("changing the workspace", function() {
            beforeEach(function() {
                this.dialog.$("select").val(this.workspace3.id).change();
            });

            it("populates the select when refresh happens", function() {
                this.dialog.render();
                expect(this.dialog.$("select")).toHaveValue(this.workspace3.id);
            });
        });

        context("clicking submit", function() {
            context("with invalid values", function() {
                beforeEach(function() {
                    this.dialog.$(".directions input:text").val("");
                    this.dialog.$("button.submit").click();
                });

                it("marks the table name as having an error", function() {
                    expect(this.dialog.$(".directions input:text")).toHaveClass("has_error");
                });
            });

            context("with a workspace with a sandbox that is not GPDB 4.1+", function() {
                beforeEach(function() {
                    this.dialog.workspaces.get(this.dialog.$("select").val()).sandbox().instance().set('version', '4.0');
                    this.dialog.$("button.submit").click();
                });

                it("shows an error about an unsupported version", function() {
                    expect(this.dialog.$(".errors").text()).toContainTranslation("hdfs_instance.gpdb_version.too_old_41");
                });
            });

            context("with a workspace with a sandbox that is GPDB 4.1+", function() {
                beforeEach(function() {
                    this.dialog.workspaces.get(this.dialog.$("select").val()).sandbox().instance().set('version', '4.1');
                    this.dialog.$("button.submit").click();
                });

                it("shows no error", function() {
                    expect(this.dialog.$(".errors").text()).toBe("");
                });
            });

            context("with valid values", function() {
                beforeEach(function() {
                    this.dialog.$("select").val(this.workspace3.id);
                    this.dialog.$('button.submit').click();
                });

                it("starts the loading spinner", function() {
                    expect(this.dialog.$("button.submit").isLoading()).toBeTruthy();
                    expect(this.dialog.$("button.submit")).toContainTranslation("hdfs.create_external.creating");
                });

                it("posts to the right URL", function() {
                    var workspaceId = this.workspace3.id;
                    var request = this.server.lastCreate();

                    expect(request.url).toMatchUrl("/workspaces/" + workspaceId + "/external_tables");
                    expect(request.params()["fake_model[table_name]"]).toBe("hi");
                    expect(request.params()["fake_model[types][]"]).toEqual(['text','text','text','text','text']);
                    expect(request.params()["fake_model[delimiter]"]).toBe(",");
                    expect(request.params()["fake_model[hdfs_entry_id]"]).toBe("234");
                    expect(request.params()["fake_model[column_names][]"]).toEqual(['column_1', 'column_2', 'column_3', 'column_4', 'column_5']);
                });

                context("when the post to import responds with success", function() {
                    beforeEach(function() {
                        spyOn(this.dialog, "closeModal");
                        spyOn(chorus, 'toast');
                        spyOn(chorus.PageEvents, 'broadcast');
                        this.server.lastCreate().succeed();
                    });

                    it("closes the dialog and displays the right toast", function() {
                        expect(this.dialog.closeModal).toHaveBeenCalled();
                        expect(chorus.toast).toHaveBeenCalledWith("hdfs.create_external.success", {workspaceName: this.workspace3.get("name"), tableName: this.dialog.$("input:text").eq(0).val()});
                    });

                    it("triggers csv_import:started", function() {
                        expect(chorus.PageEvents.broadcast).toHaveBeenCalledWith("csv_import:started");
                    });
                });
            });

            context("when the server responds with errors", function() {
                beforeEach(function() {
                    this.$type = this.dialog.$(".th .type").eq(1);
                    this.$type.find(".chosen").click();
                    this.$type.find(".popup_filter li").eq(3).find("a").click();
                    this.dialog.$("input[name=tableName]").val("testisgreat").change();
                    this.dialog.$(".field_name input").eq(0).val("gobbledigook").change();

                    this.dialog.$("button.submit").click();
                    this.server.lastCreate().failUnprocessableEntity({ fields: { a: { BLANK: {} } } });
                });

                it("has no validation errors", function() {
                    expect(this.dialog.$(".has_error").length).toBe(0);
                });

                it("retains column names", function() {
                    expect(this.dialog.$(".field_name input").eq(0).val()).toBe("gobbledigook");
                });

                it("retains the table name", function() {
                    expect(this.dialog.$("input[name=tableName]").val()).toBe("testisgreat");
                });

                it("retains the data types", function() {
                    this.$type = this.dialog.$(".th .type").eq(1);
                    expect(this.$type.find(".chosen")).toHaveText("date");
                    expect(this.$type).toHaveClass("date");
                });
            });
        });
    });
});
