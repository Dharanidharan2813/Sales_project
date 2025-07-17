import frappe
from frappe.model.document import Document
import json

class sale(Document):

    def before_save(self):
        for item in self.sales_item:
            item.amount = (item.rate or 0) * (item.quantity or 0)
        self.total_amount = sum(item.amount for item in self.sales_item)

@frappe.whitelist()
def unlock_doc_for_editing(docname,items_purchased):
    if not items_purchased:
        frappe.throw("Cannot update with empty items list.")
    items_purchased = json.loads(items_purchased)

    existing_rows = frappe.get_all("sales item", filters={"parent": docname}, pluck="name")
    
    updated_rows = []

    for row in items_purchased:
        row_name = row.get("name")
        quantity = row.get("quantity") or 0
        rate = row.get("rate") or 0
        amount = quantity * rate

        if row_name and row_name in existing_rows:
            frappe.db.set_value("sales item", row_name, {
                "id": row.get("id"),
                "quantity": quantity,
                "rate": rate,
                "amount": amount,
                "existing_name": row.get("existing_name"),
                "parent": docname,
                "parenttype": "sale",
                "parentfield": "sales_item"
            })
            updated_rows.append(row_name)
        else:
            new_item = frappe.get_doc({
                "doctype": "sales item",
                "parent": docname,
                "parenttype": "sale",
                "parentfield": "sales_item",
                "id": row.get("id"),
                "quantity": quantity,
                "rate": rate,
                "amount": amount,
                "existing_name": row.get("existing_name")
            })
            new_item.insert()
            updated_rows.append(new_item.name)

    for name in existing_rows:
        if name not in updated_rows:
            frappe.delete_doc("sales item", name, delete_permanently=True)

    frappe.db.sql("""
        UPDATE `tabsale`
        SET total_amount = (
            SELECT SUM(quantity * rate)
            FROM `tabsales item`
            WHERE parent = %s
        )
        WHERE name = %s
    """, (docname, docname))



