<script setup>
        import PDFComponent from '/.vitepress/components/pdf.vue'
</script>

# PDFファイルの挿入について
## 挿入の方法
このテンプレートでは、PDFファイルをスライド形式で挿入することができます。
挿入したいPDFファイルを`docs/.vitepress/public/assets/other/`以下に配置してください。

PDFファイルを挿入するmdの冒頭に次のように記述します。
```html
<script setup>
        import PDFComponent from '/.vitepress/components/pdf.vue'
</script>
```
そして、PDFファイルを挿入したいところに次のように記述します。
```html
<PDFComponent pdfUrl='/assets/other/sample.pdf'/>
```
すると、以下のようにPDFファイルが挿入されます。
<PDFComponent pdfUrl='/assets/other/sample.pdf'/>
