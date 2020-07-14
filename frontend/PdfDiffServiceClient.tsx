type ComputeDiffResponse = {
  status: boolean,
  // The following fields only available when status is true.
  diffId?: string,
  hasDiff?: boolean,
  diffPngUrl?: string,
}
export class PdfDiffServiceClient {
  private endpoint: string
  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async computeDiff(prevDoc: Blob, currentDoc: Blob): Promise<ComputeDiffResponse> {
    const formData = new FormData();
    formData.append('prev', prevDoc, 'prev.pdf');
    formData.append('current', currentDoc, 'current.pdf');

    try {
      const response = await fetch(this.endpoint + "/diff?img=false", {
        method: 'POST',
        body: formData,
      });

      const diffId = response.headers.get('x-pdfdiff-id');
      const changes = await response.json();
      return {
        status: true,
        hasDiff: changes && changes.length > 0,
        diffPngUrl: this.endpoint + "/diff/" + diffId + "?img=True"
      };
    } catch (e) {
      console.log(e.message);
      return {
        status: false,
      }
    }
  }
}