frappe.ui.form.on('sale', {
  refresh(frm) {
    if (frm.doc.docstatus === 1) {
      frm.add_custom_button("Update", function () {
        const dialog = new frappe.ui.Dialog({
          title: 'Edit Sales Items',
          size: 'large',
          fields: [
            {
              fieldname: 'dialog_sales_items',
              label: 'Sales Items',
              fieldtype: 'Table',
             
              cannot_add_rows: false,
              in_place_edit: true,
              fields: [
                {
                  fieldtype: 'Data',
                  fieldname: 'existing_name',
                  label: 'Existing Name',
                  //in_list_view: true,
                  hide: true,
                },
                {
                  fieldtype: 'Link',
                  fieldname: 'id',
                  label: 'ID',
                  options: 'Item',
                  reqd: 1,
                  in_list_view: true,
                },
                {
                  fieldtype: 'Currency',
                  fieldname: 'rate',
                  label: 'Rate',
                  reqd: 1,
                  in_list_view: true,
                },
                {
                  fieldtype: 'Int',
                  fieldname: 'quantity',
                  label: 'Quantity',
                  reqd: 1,
                  in_list_view: true,
                },
              ]
            }
          ],
          primary_action_label: 'Save',
          primary_action(values) {
            let data = values.dialog_sales_items || [];
            if (data.length === 0) {
              frappe.msgprint(__('Sales Item table must have at least one item.'));
              return;
            }
            if (data.some(row => !row.id || !row.quantity || row.quantity <= 0 || row.rate < 0 || !row.rate)) {
              frappe.msgprint(__('ID and Rate and Quantity are required for each item.'));
              return;
            }
            data.forEach(row => {
              row.amount = (row.rate || 0) * (row.quantity || 0);
            });

            frappe.call({
              method: "salesapp.salesapp.doctype.sale.sale.unlock_doc_for_editing",
              args: {
                docname: frm.doc.name,
                items_purchased: JSON.stringify(data)
              },
              callback: function (r) {
                if (!r.exc) {
                  frappe.show_alert("Updated successfully");
                  dialog.hide();
                  frm.reload_doc();
                }
              }
            });
          }
        });

        function generateUniqueId() {
          return 'ID-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        }

        let existing_data = frm.doc.sales_item.map(row => ({
          existing_name: row.existing_name || generateUniqueId(),
          id: row.id,
          rate: row.rate,
          quantity: row.quantity,
          amount: (row.rate || 0) * (row.quantity || 0)
        })) || [];

        dialog.fields_dict.dialog_sales_items.df.data = existing_data;
        dialog.fields_dict.dialog_sales_items.grid.refresh();

        dialog.show();
      });
    }
  }
});
