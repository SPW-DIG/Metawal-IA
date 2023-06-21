import {
    Access,
    AclDataset,
    acp_ess_1,
    createAcl,
    createAclFromFallbackAcl,
    getIri,
    getLinkedResourceUrlAll, getPodUrlAll,
    getResourceAcl,
    getResourceInfoWithAcl,
    getSolidDataset,
    getSourceUrl,
    getThing,
    getWebIdDataset,
    hasAccessibleAcl,
    hasFallbackAcl,
    hasResourceAcl,
    saveAclFor,
    setAgentDefaultAccess, setAgentResourceAccess,
    universalAccess
} from "@inrupt/solid-client";

export async function getAcrDataset(podUrl: string, options?: { fetch: typeof fetch }) {
    let acrUrl: string | null = null;
    const resourceInfo = await acp_ess_1.getResourceInfoWithAcr(podUrl, options);
    const aclServerResourceInfo = await universalAccess.getAclServerResourceInfo(resourceInfo, options);

    const relTypeLinks = aclServerResourceInfo && getLinkedResourceUrlAll(aclServerResourceInfo).type;
    if (
        aclServerResourceInfo &&
        Array.isArray(relTypeLinks) &&
        relTypeLinks.includes('http://www.w3.org/ns/solid/acp#AccessControlResource')
    ) {
        acrUrl = getSourceUrl(aclServerResourceInfo);
    }
    const acr = acrUrl && (await getSolidDataset(acrUrl, options));

    return { resourceInfo, acr, acrUrl };
}

/**
 * Retrieve the Issuer from the webId document
 * @param webId
 */
export async function getWebIdDocument(webId: string) {
    // TODO use getProfileAll and getPodUrlAllFrom

    // fetch the issuer from the webId document
    const webIdProfile = await getWebIdDataset(webId);
    const webIdThing = getThing(webIdProfile, webId);
    const issuer = webIdThing && getIri(webIdThing, 'http://www.w3.org/ns/solid/terms#oidcIssuer');
    const storage = webIdThing && getIri(webIdThing, 'http://www.w3.org/ns/pim/space#storage');
    const preferences = webIdThing && getIri(webIdThing, 'http://www.w3.org/ns/pim/space#preferencesFile');
    const privateTypeIndex = webIdThing && getIri(webIdThing, 'http://www.w3.org/ns/solid/terms#privateTypeIndex');
    const publicTypeIndex = webIdThing && getIri(webIdThing, 'http://www.w3.org/ns/solid/terms#publicTypeIndex');

    return { webId, issuer, storage, preferences, privateTypeIndex, publicTypeIndex };
}

export async function setResourceWacDefaultAccess(
    resourceUri: string,
    grantedAgent: string,
    access: Access,
    options: { fetch: typeof fetch }
) {
    // Fetch the resource info, including its inherited ACLs
    let resInfo = await getResourceInfoWithAcl(resourceUri, options);

    if (hasAccessibleAcl(resInfo)) {
        let aclDataset: AclDataset;
        if (!hasResourceAcl(resInfo)) {
            if (hasFallbackAcl(resInfo)) {
                // There's a fallback ACL, let's use it as template
                // TODO is this correct ?
                aclDataset = createAclFromFallbackAcl(resInfo);
            } else {
                // create a blank ACL
                aclDataset = createAcl(resInfo);
            }
        } else {
            aclDataset = getResourceAcl(resInfo);
        }

        //resInfo = await getResourceInfoWithAcl(resourceUri, options);

        // update the ACL dataset wit the new access modes
        aclDataset = setAgentDefaultAccess(aclDataset, grantedAgent, access);

        aclDataset = setAgentResourceAccess(aclDataset, grantedAgent, access);

        await saveAclFor(resInfo, aclDataset, options);
    } else {
        throw new Error('Insufficient rights to modify ACL for ' + resourceUri);
    }
}

export async function addRootAcl(podUri: string, options?: { fetch: typeof fetch }) {
    const grantee = 'https://api.datavillage.me';
    const access = { read: true, write: true, append: true };

    let accessModes = await universalAccess.setAgentAccess(podUri, grantee, access, options);

    /*
  const resourceInfo = await getResourceInfo(podRoot, options);
  const acrUrl = await getAcrUrl(resourceInfo, options);
  const acr = await getResourceAcr(resourceInfo, options);

  if (acrUrl == null || acr == null) {
      await setAgentAccessWac(resourceInfo, grantee, access as WacAccess, options);
      return getAgentAccessWac(resourceInfo, grantee, options);
      return;
  }

  // TODO: Make sure both setAgentAccessWac and setAgentAccessAcp don't save within the function, expose one standard saveAclFor function that is universal.
  try {
      //await saveAcrFor(await setAgentAccessAcp(acr, grantee, access), options);
      return await getAgentAccess(podRoot, grantee, options);
  } catch (e) {
      return null;
  }

   */

    accessModes;

    // check
    accessModes = await universalAccess.getAgentAccess(
        podUri,
        'https://api.datavillage.me',
        { fetch: fetch as any } // fetch function from authenticated session
    );

    accessModes;
    // try to PUT a file
    //fetch()
}



export async function isPimStorage(uri: string, options?: {fetch: typeof fetch}) {
    // let's fetch the resource and look at its 'link' headers
    return await (options?.fetch || fetch)(uri, { method: 'HEAD' }).then(
        resp => {
            const linksHeaders = resp.headers.get('Link');

            // let's parse the 'link' header values into an array of {uri: "...", params: {key: "value"}}
            const links = linksHeaders
                ? linksHeaders
                    .split(/,\s*</)
                    // split    <uri>; param1=val1; param2=val2     into     ["...original string" , uri, "; param1=val1; param2=val2", ...]
                    .map(linkStr => linkStr.match(/<?([^>]*)>(.*)/))
                    .map(values => {
                        if (!values) return undefined;

                        const uri = values[1];
                        const paramsStr = values[2].split(";");
                        const params = paramsStr
                            // parse rel="type" into ["...whatever" , "rel", "type", ...]
                            .map(paramStr => paramStr.match(/\s*(.+)\s*=\s*"?([^"]+)"?/))
                            .reduce(
                                (prev, kvp) => (kvp ? { ...prev, [kvp[1]]: kvp[2] } : prev),
                                {} as Record<string, any>
                            );
                        return { uri, params };
                    })
                : [];

            // look for a link that exposes a type of http://www.w3.org/ns/pim/space#Storage
            return !!links.find(
                link => link && link.params.rel == 'type' && link.uri == 'http://www.w3.org/ns/pim/space#Storage'
            );
        },
        err => false
    );
}

export async function findParentPimStorage(webId: string, options?: {fetch: typeof fetch})  {
    // first let's take the current folder containing the WebID doc
    const folderUri = new URL('.', webId).toString();

    // then climb up the folder tree to find one that advertises a pim:storage
    for (let currentUri = folderUri; currentUri; ) {
        const test = await isPimStorage(currentUri, options);
        if (test) return currentUri;

        const nextUri = new URL('..', currentUri).toString();
        if (nextUri == currentUri) break;

        currentUri = nextUri;
    }
    return undefined;
}


export async function getPodUrls(webId: string, options?: {fetch: typeof fetch}) {
    const podUrls = await getPodUrlAll(webId, options);

    if (!podUrls.length) {
        // there's no http://www.w3.org/ns/pim/space#storage in the WebID doc
        // --> follow the recommended approach here : https://forum.solidproject.org/t/data-discovery-on-community-solid-server/4695/8

        // look for a parent folder that is marked as a pim storage
        const storageUri = await findParentPimStorage(webId, options);

        return storageUri ? [storageUri] : [];
    }

    return podUrls;
}
