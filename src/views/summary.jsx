import React, { useMemo } from "react";
import { Modal, ModalBody, ModalFooter, Button, Row, Col } from "reactstrap";

const safeJsonParse = (value, fallback = {}) => {
	if (!value) return fallback;
	if (typeof value === "object") return value;
	try {
		return JSON.parse(value);
	} catch (error) {
		return fallback;
	}
};

const getField = (obj, keys, fallback = "-") => {
	if (!obj) return fallback;
	for (const key of keys) {
		if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
			return obj[key];
		}
	}
	return fallback;
};

const asMoney = (value, suffix = "") => {
	const num = typeof value === "number" ? value : Number(String(value || "").replace(/[$,]/g, ""));
	if (Number.isNaN(num)) return value || "-";
	return `$${num.toFixed(2)}${suffix ? ` ${suffix}` : ""}`;
};

const toOnOff = (value, trueWhen = ["1", 1, true, "true", "ON", "Online"]) => {
	return trueWhen.includes(value) ? "On" : "Off";
};

const fromSelectionObject = (value, emptyLabel) => {
	const parsed = safeJsonParse(value, {});
	const selected = Object.entries(parsed)
		.filter(([_, selectedValue]) => selectedValue && selectedValue !== "false")
		.map(([_, selectedValue]) => String(selectedValue));
	return selected.length > 0 ? selected.join(", ") : emptyLabel;
};

const formatFlightDate = (campaign) => {
	const startRaw = getField(campaign, ["flightStartdate", "startDate", "activate_time", "activateTime"], null);
	const endRaw = getField(campaign, ["flightEnddate", "endDate", "expire_time", "expireTime"], null);

	const toDate = (raw) => {
		if (!raw) return null;
		if (raw instanceof Date) return raw;
		if (typeof raw === "number") return new Date(raw);
		const parsed = new Date(raw);
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	};

	const start = toDate(startRaw);
	const end = toDate(endRaw);
	const fmt = (date) => date?.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });

	if (start && end) return `From ${fmt(start)} to ${fmt(end)}`;
	if (start) return `From ${fmt(start)}`;
	return "Not set";
};

const SummaryModal = ({ isOpen, onClose, campaign }) => {
	const campaignVideos = useMemo(
		() => campaign?.campaignVideos || campaign?.campaignVideo || {},
		[campaign]
	);

	const campaignTargetDevices = useMemo(
		() => campaign?.campaignTargetDevices || campaign?.devices_data || {},
		[campaign]
	);

	const audioSource = useMemo(() => {
		const parsedAudio = safeJsonParse(campaignVideos.audio, {});
		if (Object.keys(parsedAudio).length > 0) return parsedAudio;
		return safeJsonParse(campaign?.audio, {});
	}, [campaign, campaignVideos]);

	const campaignName = getField(campaign, ["name"], "Campaign");
	const status = getField(campaign, ["status"], "OFF");
	const bid = getField(campaign, ["cpmBid", "cpm_bid"], "-");
	const maxBid = getField(campaign, ["price", "maxBid"], "-");
	const crossDevice = getField(campaign, ["crossDevice", "cross_device"], false);
	const capspec = getField(campaign, ["capspec"], "0");
	const capcount = getField(campaign, ["capcount"], 0);
	const capexpire = getField(campaign, ["capexpire"], 0);
	const capunit = getField(campaign, ["capunit"], "seconds");
	const totalBudget = getField(campaign, ["totalBudget", "total_budget", "budget"], "-");
	const pacing = getField(campaign, ["pacing"], null);
	const allTime = getField(campaign, ["allTime", "all_time"], "1");
	const serviceProvider = getField(campaign, ["serviceProvider", "service_provider"], "0");
	const optimize = getField(campaign, ["optimize"], "0");
	const trackConversions = getField(campaign, ["trackConversions", "track_conversions"], "0");
	const measureViewability = getField(campaign, ["measureViewability", "measure_viewability"], "0");
	const inventoryExchange = getField(campaign, ["inventoryExchange", "inventory_exchange"], []);
	const inventoryDomain = getField(campaign, ["inventoryDomain", "inventory_domain"], []);
	const notes = getField(campaign, ["notes"], "None");
	const pageFold = safeJsonParse(getField(campaign, ["pageFold", "page_fold"], {}), {});
	const adOptimization = getField(campaign, ["addOptimization", "ad_optimization"], "0");
	const bidShading = getField(campaign, ["bidShading", "bid_shading"], false);
	const smartDisable = getField(campaign, ["smartDisable", "smart_disable"], 1);
	
	const audienceCapture = safeJsonParse(
		getField(campaignVideos, ["audienceCapture"], getField(campaign, ["audience_capture"], {})),
		{}
	);

	const locationTargets = useMemo(() => {
		const raw = getField(campaign, ["location_targets", "locationTargets"], []);
		if (Array.isArray(raw)) return raw;
		const parsed = safeJsonParse(raw, []);
		return Array.isArray(parsed) ? parsed : [];
	}, [campaign]);

	const feedType = (() => {
		if (!audioSource || Object.keys(audioSource).length === 0) return "All Feed Types";
		const allTrue = Object.values(audioSource).every((value) => value === true || value === "true" || value === 1 || value === "1");
		if (allTrue) return "All Feed Types";
		const selected = Object.entries(audioSource)
			.filter(([_, value]) => value === true || value === "true" || value === 1 || value === "1")
			.map(([key]) => key);
		return selected.length > 0 ? selected.join(", ") : "All Feed Types";
	})();

	const formatArrayCount = (value) => {
		if (Array.isArray(value)) return value.length;
		if (typeof value === "string" && value.trim().length > 0) {
			return value.split(",").filter(Boolean).length;
		}
		return 0;
	};

	const locationSummary = (() => {
		if (!locationTargets || locationTargets.length === 0) return "No Targeting";
		const first = locationTargets[0] || {};
		const parts = [
			first.region_name || first.regionName || first.region_id || first.regionId,
			first.subregion_name || first.subregionName || first.subregion_id || first.subregionId,
			first.country_name || first.countryName || first.country_id || first.countryId,
			first.state_name || first.stateName || first.state_id || first.stateId,
		];
		const cities = Array.isArray(first.city_name)
			? first.city_name.join(", ")
			: Array.isArray(first.city_id)
				? first.city_id.join(", ")
				: first.city_name || first.cityName || "";
		if (cities) parts.push(cities);
		const cleaned = parts.filter(Boolean).map((item) => String(item));
		return cleaned.length ? cleaned.join(" > ") : "No Targeting";
	})();

	const hyperLocalSummary = (() => {
		if (!locationTargets || locationTargets.length === 0) return "No Coordinates";
		const points = [];
		locationTargets.forEach((target) => {
			const latitudes = target?.latitudes || [];
			const longitudes = target?.longitudes || [];
			const ranges = target?.ranges || [];
			for (let i = 0; i < latitudes.length; i += 1) {
				points.push(`(${latitudes[i]}, ${longitudes[i] ?? "-"}, ${ranges[i] ?? "-"})`);
			}
		});
		return points.length ? points.join(", ") : "No Coordinates";
	})();

	const deviceTargetSummary = (() => {
		const deviceType = getField(campaignTargetDevices, ["deviceType", "device_type"], "all");
		if (deviceType === "all") return "Targeting All Devices";
		const selectedDevices = campaignTargetDevices?.selectedDevices || campaignTargetDevices;
		const labels = [];
		if (selectedDevices.desktop) labels.push("Desktop");
		if (selectedDevices.phone) labels.push("Phone");
		if (selectedDevices.tablet) labels.push("Tablet");
		if (selectedDevices.connected_tv) labels.push("Connected TV");
		return labels.length ? `Targeting ${labels.join(", ")}` : "No Devices Selected";
	})();

	const contextualSummary = (() => {
		const iab = getField(campaignTargetDevices, ["iab_category", "iabCategory"], getField(campaign, ["iab_category"], []));
		if (Array.isArray(iab) && iab.length) return iab.map((item) => (typeof item === "object" ? item.label || item.name : item)).join(", ");
		if (typeof iab === "string" && iab.trim()) return iab;
		return "No Targeting";
	})();

	const pagePositionSummary = (() => {
		if (!pageFold || typeof pageFold !== "object") return "None";
		if (pageFold.above_fold && pageFold.below_fold && pageFold.page_unknown) return "All";
		const list = [];
		if (pageFold.above_fold) list.push("Above Fold");
		if (pageFold.below_fold) list.push("Below Fold");
		if (pageFold.page_unknown) list.push("Unknown");
		return list.length ? list.join(", ") : "None";
	})();

	const audienceCaptureSummary = (() => {
		const selected = Object.entries(audienceCapture || {})
			.filter(([_, value]) => value && value !== "")
			.map(([_, value]) => String(value));
		return selected.length ? selected.join(", ") : "Off";
	})();

	const carrierSummary = (() => {
		const carrier = getField(campaignTargetDevices, ["carrier"], "all");
		return carrier === "all" ? "All Carriers" : carrier;
	})();

	// Add custom CSS for sticky headers
	// Add custom CSS for sticky headers
const styles = `
	.modal-content {
		max-height: 90vh;
		display: flex;
		flex-direction: column;
	}
	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 0 !important;
		display: flex;
		flex-direction: column;
	}
	.sticky-header-wrapper {
		position: sticky;
		top: 0;
		background-color: white;
		z-index: 1000;
		padding: 1.5rem 1.5rem 0.5rem 1.5rem;
		border-bottom: 2px solid #dee2e6;
		width: 100%;
		box-shadow: 0 2px 4px rgba(0,0,0,0.05);
	}
	.sticky-header-wrapper h2 {
		font-size: 25px;
		margin-bottom: 0.5rem !important;
	}
	.sticky-header-wrapper hr {
		margin: 0.5rem 0 0 0;
		opacity: 0.2;
	}
	.table-container {
		padding: 0 1.5rem 1.5rem 1.5rem;
		flex: 1;
	}
	.no-border-table td, .no-border-table th {
		border: none !important;
		padding: 8px 12px;
	}
	.no-border-table tr {
		border-bottom: 1px solid #f0f0f0;
	}
`;
	return (
  <Modal isOpen={isOpen} toggle={onClose} size="xl" centered scrollable backdrop="static">
    <style>{styles}</style>
    <ModalBody>
      {/* Sticky Header Section */}
      <div className="sticky-header-wrapper">
        <h2>
          {campaignName} Summary
        </h2>
        <hr />
      </div>

      {/* Scrollable Content Section */}
      <div className="table-container">
        <Row className="g-3">
          {/* LEFT COLUMN - BASIC OPTIONS */}
          <Col xs="12" md="6">
            <table className="table mb-4 mt-3 no-border-table">
              <thead>
                <tr>
                  <th colSpan="3">Basic Options</th>
                </tr>
              </thead>
              <tbody>
                <tr><th colSpan="3"><b>Basics</b></th></tr>
                <tr><td>Status</td><td colSpan="2">{String(status).toUpperCase() === "ON" ? "ON" : "OFF"}</td></tr>
                <tr><td>Name</td><td colSpan="2">{campaignName}</td></tr>
                <tr><td>Bid</td><td colSpan="2">{asMoney(bid, "USD CPM")}</td></tr>
                <tr><td>Max Bid</td><td colSpan="2">{asMoney(maxBid, "USD CPM")}</td></tr>
                <tr><td>Bid Shading</td><td colSpan="2">{toOnOff(bidShading, ["1", 1, true, "true", "Enabled"])}</td></tr>
                <tr><td>Cross-Device</td><td colSpan="2">{toOnOff(crossDevice)}</td></tr>
                <tr>
                  <td>Frequency Cap</td>
                  <td colSpan="2">
                    {String(capspec) === "0" || !capspec
                      ? "No Cap"
                      : `${capcount} per ${capexpire} ${capunit}`}
                  </td>
                </tr>
                <tr><td>Bid Multiplier</td><td colSpan="2">{toOnOff(smartDisable, ["0", 0, false, "false"])}</td></tr>

                <tr><th colSpan="3"><b>Budget</b></th></tr>
                <tr><td>Budget</td><td colSpan="2">{asMoney(totalBudget, "USD Daily")}</td></tr>
                <tr>
                  <td>Pacing</td>
                  <td colSpan="2">
                    {String(pacing) === "1"
                      ? "Pacing campaign budget evenly"
                      : "No pacing"}
                  </td>
                </tr>
                <tr><td>Flight Date</td><td colSpan="2">{formatFlightDate(campaign)}</td></tr>
                <tr><td>Day Parting</td><td colSpan="2">{String(allTime) === "1" ? "No Day Parting" : "Day Parting Enabled"}</td></tr>
                <tr><td>Service Provider</td><td colSpan="2">{String(serviceProvider) === "0" ? "None" : serviceProvider}</td></tr>

                <tr><th colSpan="3"><b>Optimization & Measurement</b></th></tr>
                <tr><td>Optimization</td><td colSpan="2">{toOnOff(optimize)}</td></tr>
                <tr><td>Track Conversions</td><td colSpan="2">{toOnOff(trackConversions)}</td></tr>
                <tr><td>Measure Viewability</td><td colSpan="2">{toOnOff(measureViewability)}</td></tr>

                <tr><th colSpan="3"><b>Campaign Notes</b></th></tr>
                <tr><td>Notes</td><td colSpan="2">{notes || "None"}</td></tr>
              </tbody>
            </table>
          </Col>

          {/* RIGHT COLUMN - ADVANCED OPTIONS */}
          <Col xs="12" md="6">
            <table className="table no-border-table mb-4 mt-3">
              <thead>
                <tr>
                  <th colSpan="3">Advanced Options</th>
                </tr>
              </thead>
              <tbody>
                <tr><th colSpan="3"><b>Inventory</b></th></tr>
                <tr>
                  <td>Exchange Inventory</td>
                  <td colSpan="2">{formatArrayCount(inventoryExchange)} Exchanges</td>
                </tr>
                <tr>
                  <td>Domain/App Inventory</td>
                  <td colSpan="2">{formatArrayCount(inventoryDomain)} Domains & Apps</td>
                </tr>

                <tr><th colSpan="3"><b>Location</b></th></tr>
                <tr><td>Location Targeting</td><td colSpan="2">{locationSummary}</td></tr>
                <tr><td>Hyperlocal</td><td colSpan="2">{hyperLocalSummary}</td></tr>

                <tr><th colSpan="3"><b>Device Targeting</b></th></tr>
                <tr><td>Device Types</td><td colSpan="2">{deviceTargetSummary}</td></tr>
                <tr><td>Mobile Carriers</td><td colSpan="2">{carrierSummary}</td></tr>
                <tr><td>Connection Types</td><td colSpan="2">All Connection Types</td></tr>

                <tr><th colSpan="3"><b>Contextual</b></th></tr>
                <tr><td>IAB Categories</td><td colSpan="2">{contextualSummary}</td></tr>
                <tr><td>Page Position</td><td colSpan="2">{pagePositionSummary}</td></tr>

                <tr><th colSpan="3"><b>Video</b></th></tr>
                <tr><td>Placement Type</td><td colSpan="2">{fromSelectionObject(campaignVideos.placementType, "All Placement Types")}</td></tr>
                <tr><td>Roll Positions</td><td colSpan="2">{fromSelectionObject(campaignVideos.rollPosition, "All Roll Positions")}</td></tr>
                <tr><td>Player Size</td><td colSpan="2">{fromSelectionObject(campaignVideos.playerSize, "Any allowed")}</td></tr>
                <tr><td>Skippable Ads</td><td colSpan="2">{fromSelectionObject(campaignVideos.skippableAds, "Any allowed")}</td></tr>
                <tr><td>Playback Method</td><td colSpan="2">{fromSelectionObject(campaignVideos.playbackMethod, "All playback methods targeted")}</td></tr>
                <tr><td>Reward Statuses</td><td colSpan="2">{fromSelectionObject(campaignVideos.rewardStatus, "All reward statuses targeted")}</td></tr>
                <tr><td>Orientation Matching</td><td colSpan="2">{toOnOff(getField(campaignVideos, ["orientationMatching", "orientation_matching"], "0"))}</td></tr>

                <tr><th colSpan="3"><b>Audio</b></th></tr>
                <tr><td>Feed Type</td><td colSpan="2">{feedType}</td></tr>
                <tr><td>Roll Position</td><td colSpan="2">{fromSelectionObject(campaignVideos.rollPosition, "All Roll Positions")}</td></tr>

                <tr><th colSpan="3"><b>Advanced Features</b></th></tr>
                <tr><td>Audience Capture</td><td colSpan="2">{audienceCaptureSummary}</td></tr>
                <tr><td>Ad Optimization</td><td colSpan="2">{toOnOff(adOptimization)}</td></tr>
                <tr><td>Brand Protection</td><td colSpan="2">No Targeting</td></tr>

                <tr><th colSpan="3"><b>Deals</b></th></tr>
                <tr><td>Private Deals</td><td colSpan="2">No Deals</td></tr>
                <tr><td>Deal Groups</td><td colSpan="2">No Deal Groups</td></tr>
                <tr><td>Adaptive Deal Bid</td><td colSpan="2">-</td></tr>
              </tbody>
            </table>
          </Col>
        </Row>
      </div>
    </ModalBody>

    <ModalFooter>
      <Button className="sum-btn" onClick={onClose}>
        Close
      </Button>
    </ModalFooter>
  </Modal>
);
};

export default SummaryModal;