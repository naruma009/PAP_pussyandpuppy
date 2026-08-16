import { useCallback, useEffect, useRef, useState } from "react";
import { AGE_GROUPS, buildProductFormData, CATEGORIES, EMPTY_PRODUCT_FORM, PET_TYPES, productToForm, validateProductImage } from "../../features/admin/productForm";
import { usePreferences } from "../../features/preferences/PreferenceProvider";
import ProductPreview from "./ProductPreview";

export default function ProductAdminForm({ editingProduct, busy, error, onCancel, onSubmit }) {
  const { t } = usePreferences();
  const [values, setValues] = useState(EMPTY_PRODUCT_FORM);
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileError, setFileError] = useState("");
  const [fileKey, setFileKey] = useState(0);
  const objectUrl = useRef("");
  const clearObjectUrl = useCallback(() => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = "";
  }, []);
  const reset = useCallback((product = null) => {
    clearObjectUrl(); setValues(productToForm(product)); setImage(null); setPreviewUrl(product?.image || ""); setFileError(""); setFileKey((value) => value + 1);
  }, [clearObjectUrl]);
  useEffect(() => { reset(editingProduct); }, [editingProduct, reset]);
  useEffect(() => () => clearObjectUrl(), [clearObjectUrl]);
  const update = (event) => {
    const { name, type, checked, value } = event.target;
    setValues((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };
  const chooseImage = (event) => {
    const next = event.target.files?.[0] || null;
    const validation = validateProductImage(next);
    clearObjectUrl();
    if (validation) {
      setImage(null); setPreviewUrl(editingProduct?.image || ""); setFileError(t(validation === "tooLarge" ? "imageTooLarge" : "invalidImageType")); setFileKey((value) => value + 1); return;
    }
    setFileError(""); setImage(next);
    if (next) { objectUrl.current = URL.createObjectURL(next); setPreviewUrl(objectUrl.current); }
    else setPreviewUrl(editingProduct?.image || "");
  };
  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    const succeeded = await onSubmit(buildProductFormData(values, image));
    if (succeeded) reset();
  };
  const cancel = () => { reset(); onCancel(); };
  return <div className="admin-workspace"><form className="admin-form" onSubmit={submit}><h2>{t("productInformation")}</h2><div className="field"><label htmlFor="admin-image">{t("productImage")}</label><input key={fileKey} id="admin-image" name="image" type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseImage} disabled={busy} /><small>{t("imageHelp")}</small></div><div className="field"><label htmlFor="admin-name">{t("productName")}</label><input id="admin-name" name="name" required value={values.name} onChange={update} disabled={busy} /></div><div className="field"><label htmlFor="admin-description">{t("productDescription")}</label><textarea id="admin-description" name="description" required value={values.description} onChange={update} disabled={busy} /></div><div className="form-row"><div className="field"><label htmlFor="admin-price">{t("productPrice")}</label><input id="admin-price" name="price" type="number" min="0" step="0.01" required value={values.price} onChange={update} disabled={busy} /></div><div className="field"><label htmlFor="admin-stock">{t("stockQuantity")}</label><input id="admin-stock" name="stock" type="number" min="0" step="1" required value={values.stock} onChange={update} disabled={busy} /></div></div><div className="form-row"><div className="field"><label htmlFor="admin-category">{t("category")}</label><select id="admin-category" name="category" value={values.category} onChange={update} disabled={busy}>{CATEGORIES.map((category) => <option key={category} value={category}>{t(`category.${category}`)}</option>)}</select></div><div className="field"><label htmlFor="admin-pet-type">{t("petType")}</label><select id="admin-pet-type" name="petType" value={values.petType} onChange={update} disabled={busy}>{PET_TYPES.map((pet) => <option key={pet} value={pet}>{t(`adminPet.${pet}`)}</option>)}</select></div></div><div className="field"><label htmlFor="admin-age">{t("age")}</label><select id="admin-age" name="ageGroup" value={values.ageGroup} onChange={update} disabled={busy}>{AGE_GROUPS.map((age) => <option key={age} value={age}>{t(`adminAge.${age}`)}</option>)}</select></div><label className="check-field"><input type="checkbox" name="featured" checked={values.featured} onChange={update} disabled={busy} /> {t("featuredProduct")}</label><div className="form-actions"><button className="button" type="submit" disabled={busy}>{t(busy ? "savingProduct" : editingProduct ? "saveChanges" : "addProduct")}</button><button className="ghost-button" type="button" onClick={cancel} disabled={busy}>{t(editingProduct ? "cancelEdit" : "clearForm")}</button></div><p className="status" role={fileError || error ? "alert" : undefined} aria-live="polite">{fileError || error}</p></form><ProductPreview values={values} image={previewUrl} /></div>;
}
