import axios from 'axios';
import { parseString } from 'xml2js';

class ScormService {
  /**
   * Fetches imsmanifest.xml from the SCORM package URL and returns
   * the count of LEAF items (actual slides/subtopics shown in the course menu).
   *
   * In Articulate Storyline, the manifest has a structure like:
   *   <organization>
   *     <item identifierref="...">  ← slide 1 (leaf)
   *     <item identifierref="...">  ← slide 2 (leaf)
   *     ...
   *   </organization>
   *
   * We count only items that have an identifierref (i.e. they point to
   * actual content), not container items.
   */
  async countSubtopicsFromUrl(scormUrl: string): Promise<number> {
    try {
      const baseUrl = scormUrl.substring(0, scormUrl.lastIndexOf('/') + 1);
      const manifestUrl = `${baseUrl}imsmanifest.xml`;
      console.log(`\ud83c\udf0e [SCORM MANIFEST] Fetching: ${manifestUrl}`);

      const response = await axios.get(manifestUrl, { timeout: 8000 });
      return new Promise((resolve) => {
        parseString(response.data, { explicitArray: true }, (err, result) => {
          if (err) {
            console.error('\u274c [SCORM MANIFEST] Parse error:', err);
            resolve(0);
            return;
          }

          try {
            // Navigate: manifest > organizations > organization > item[]
            const manifest = result?.manifest;
            const organizations = manifest?.organizations?.[0];
            const organization = organizations?.organization?.[0];
            const items = organization?.item || [];

            // Count only leaf items (those with identifierref — actual slides)
            const leafCount = this.countLeafItems(items);
            console.log(`\u2705 [SCORM MANIFEST] Found ${leafCount} subtopics in course menu`);
            resolve(leafCount);
          } catch (parseErr) {
            console.error('\u274c [SCORM MANIFEST] Structure error:', parseErr);
            resolve(0);
          }
        });
      });
    } catch (error) {
      console.warn('\u26a0\ufe0f [SCORM MANIFEST] Could not fetch manifest:', error);
      return 0;
    }
  }

  /**
   * Recursively count leaf items (items that have identifierref = actual content slides).
   * Items without identifierref are just containers/chapters.
   */
  private countLeafItems(items: any[]): number {
    let count = 0;
    for (const item of items) {
      const hasContent = item?.$?.identifierref;
      const children = item?.item || [];

      if (children.length > 0) {
        // This is a container — recurse into children
        count += this.countLeafItems(children);
      } else if (hasContent) {
        // This is a leaf slide
        count++;
      }
    }
    return count;
  }
}

export default new ScormService();
